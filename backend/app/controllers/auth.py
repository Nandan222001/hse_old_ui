from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User
from app.models.app_role import AppRole
from app.schemas.auth import LoginRequest, TokenData, TokenResponse
from app.services.auth_service import verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with username or email + password and return a JWT."""
    # Look up user by username OR email
    user = (
        db.query(User)
        .filter(
            (User.username == payload.username) | (User.email == payload.username)
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    # Fetch the role
    app_role = db.query(AppRole).filter(AppRole.id == user.app_role_id).first()
    if not app_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User role not found",
        )

    token_payload = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": app_role.name,
        "role_level": app_role.level,
    }

    access_token = create_access_token(token_payload)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=TokenData(
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=app_role.name,
            role_level=app_role.level,
        ),
    )


@router.get("/me")
def get_me(request: Request):
    """Return current user info from JWT in Authorization header."""
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

    return {
        "user_id": int(payload.get("sub", 0)),
        "username": payload.get("username"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "role_level": payload.get("role_level"),
    }
