from fastapi import Depends, HTTPException, Request, Query, status
from app.services.auth_service import decode_access_token


class PaginationParams:
    """Reusable pagination dependency injected into any list endpoint."""

    def __init__(
        self,
        skip: int = Query(default=0, ge=0, description="Records to skip"),
        limit: int = Query(default=100, ge=1, le=1000, description="Max records to return"),
    ) -> None:
        self.skip = skip
        self.limit = limit


class CurrentUser:
    """Decoded JWT payload for the authenticated user."""

    def __init__(self, user_id: int, username: str, email: str, role: str, org_id: int | None):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.role = role
        self.org_id = org_id


def get_current_user(request: Request) -> CurrentUser:
    """FastAPI dependency — validates JWT and returns the current user with org_id."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return CurrentUser(
        user_id=int(payload.get("sub", 0)),
        username=payload.get("username", ""),
        email=payload.get("email", ""),
        role=payload.get("role", ""),
        org_id=payload.get("org_id"),
    )
