from fastapi import Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User
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


def get_current_user(request: Request, db: Session = Depends(get_db)) -> CurrentUser:
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

    token_user_id = int(payload.get("sub", 0))
    token_email = payload.get("email", "")
    token_org_id = payload.get("org_id")

    user = None
    if token_user_id:
        user = db.query(User).filter(User.id == token_user_id).first()
    if user is None and token_email:
        user = db.query(User).filter(User.email == token_email).first()

    org_id = user.organisation_id if user and user.organisation_id is not None else token_org_id
    role = payload.get("role", "")
    if org_id is not None:
        try:
            org_id = int(org_id)
        except (TypeError, ValueError):
            org_id = None
    if org_id is None and role.lower() != "superadmin":
        # Normal tenant users without completed organisation setup must not see
        # global/seed rows. Most tenant controllers interpret None as unscoped,
        # so use an impossible id to produce empty tenant-scoped results.
        org_id = -1

    return CurrentUser(
        user_id=token_user_id,
        username=user.username if user else payload.get("username", ""),
        email=user.email if user else token_email,
        role=role,
        org_id=org_id,
    )
