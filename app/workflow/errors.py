"""Domain errors.

Services raise these; the API layer turns them into HTTP responses with a
stable ``code`` so the frontend can branch on behaviour, not on prose.
"""

from typing import Any, Dict, Optional


class DomainError(Exception):
    status_code = 400
    code = "DOMAIN_ERROR"

    def __init__(
        self,
        message: str,
        *,
        code: Optional[str] = None,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        self.details = details or {}

    def as_dict(self) -> Dict[str, Any]:
        return {
            "detail": self.message,
            "code": self.code,
            **({"details": self.details} if self.details else {}),
        }


class NotFound(DomainError):
    status_code = 404
    code = "NOT_FOUND"


class Forbidden(DomainError):
    status_code = 403
    code = "FORBIDDEN"


class Unauthorized(DomainError):
    status_code = 401
    code = "UNAUTHORIZED"


class Conflict(DomainError):
    status_code = 409
    code = "CONFLICT"


class ValidationFailed(DomainError):
    status_code = 422
    code = "VALIDATION_FAILED"
