"""Session identity and role enforcement.

The legacy prototype returned a token nobody checked. This module actually
validates it, which is the difference between a demo and a security hole.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Request

from app.workflow import store
from app.workflow.enums import Role
from app.workflow.errors import Forbidden, Unauthorized
from app.workflow.security import hash_token, new_token

SESSION_COOKIE = "dhamini_session"
SESSION_TTL_DAYS = 7


@dataclass(frozen=True)
class Principal:
    user_id: str
    email: str
    name: str
    role: str
    org_id: Optional[str] = None
    creator_id: Optional[str] = None

    @property
    def is_ops(self) -> bool:
        return self.role in (Role.OPS_ADMIN.value, Role.OPS_REVIEWER.value)

    @property
    def is_brand(self) -> bool:
        return self.role in (Role.BRAND_ADMIN.value, Role.BRAND_MEMBER.value)

    def require_org(self) -> str:
        if not self.org_id:
            raise Forbidden("This action requires a brand organisation.")
        return self.org_id


def create_session(
    *,
    user_id: str,
    role: str,
    org_id: Optional[str] = None,
    creator_id: Optional[str] = None,
) -> str:
    raw = new_token()
    now = datetime.now(timezone.utc)
    store.insert(
        "sessions",
        {
            "token_hash": hash_token(raw),
            "user_id": user_id,
            "role": role,
            "org_id": org_id,
            "creator_id": creator_id,
            "expires_at": (now + timedelta(days=SESSION_TTL_DAYS)).isoformat(),
            "created_at": now.isoformat(),
        },
    )
    return raw


def _raw_token(request: Request) -> Optional[str]:
    header = request.headers.get("authorization") or ""
    if header.lower().startswith("bearer "):
        return header.split(" ", 1)[1].strip()
    return request.cookies.get(SESSION_COOKIE)


def resolve(raw: Optional[str]) -> Optional[Principal]:
    if not raw:
        return None
    session = store.get("sessions", hash_token(raw), id_col="token_hash")
    if not session:
        return None
    expires_at = session.get("expires_at")
    if expires_at:
        try:
            if datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
                return None
        except ValueError:
            return None
    user = store.get("users", session["user_id"])
    if not user:
        return None
    return Principal(
        user_id=user["id"],
        email=user["email"],
        name=user["name"],
        role=session["role"],
        org_id=session.get("org_id") or user.get("org_id"),
        creator_id=session.get("creator_id"),
    )


def optional_principal(request: Request) -> Optional[Principal]:
    return resolve(_raw_token(request))


def current_principal(request: Request) -> Principal:
    principal = optional_principal(request)
    if not principal:
        raise Unauthorized("Sign in to continue.", code="NOT_AUTHENTICATED")
    return principal


def require(*roles: str):
    """Dependency factory: allow only the listed roles."""

    allowed = {r.value if isinstance(r, Role) else str(r) for r in roles}

    def dependency(principal: Principal = Depends(current_principal)) -> Principal:
        if principal.role not in allowed:
            raise Forbidden(
                f"This action requires one of: {', '.join(sorted(allowed))}",
                code="ROLE_REQUIRED",
                details={"required": sorted(allowed), "actual": principal.role},
            )
        return principal

    return dependency


def require_brand(principal: Principal = Depends(current_principal)) -> Principal:
    if not principal.is_brand:
        raise Forbidden("Brand access only.", code="BRAND_ONLY")
    return principal


def require_ops(principal: Principal = Depends(current_principal)) -> Principal:
    if not principal.is_ops:
        raise Forbidden("Ops access only.", code="OPS_ONLY")
    return principal


def require_creator(principal: Principal = Depends(current_principal)) -> Principal:
    if principal.role != Role.CREATOR.value or not principal.creator_id:
        raise Forbidden("Creator access only.", code="CREATOR_ONLY")
    return principal


def delete_session(raw: str) -> None:
    store.execute("DELETE FROM sessions WHERE token_hash = ?", (hash_token(raw),))
