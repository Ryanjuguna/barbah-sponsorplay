"""Tokens, password hashing and request identity.

No external dependencies: ``hashlib`` and ``secrets`` are enough for the demo
and keep the deployment surface small. Magic-link tokens are stored only as
SHA-256 hashes, so a database leak does not hand out live links.
"""

import hashlib
import hmac
import secrets
from typing import Optional

_PBKDF2_ROUNDS = 200_000


def new_token(nbytes: int = 32) -> str:
    """A URL-safe, high-entropy token suitable for a magic link."""
    return secrets.token_urlsafe(nbytes)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def hash_password(password: str, salt: Optional[str] = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ROUNDS
    ).hex()
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, rounds, salt, digest = stored.split("$", 3)
    except ValueError:
        return False
    if scheme != "pbkdf2_sha256":
        return False
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), int(rounds)
    ).hex()
    return hmac.compare_digest(candidate, digest)


def sign_payload(secret: str, payload: str) -> str:
    return hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
