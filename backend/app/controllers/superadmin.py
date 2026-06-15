import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import get_settings
from app.models.organisation_invite import OrganisationInvite
from app.models.organisation import Organisation
from app.schemas.organisation_invite import (
    InviteOrganisationRequest,
    InviteOrganisationResponse,
    InviteListResponse,
)
from app.services.email_service import send_organisation_invite
from app.utils.logger import get_logger

router = APIRouter(prefix="/superadmin", tags=["SuperAdmin"])
settings = get_settings()
logger = get_logger(__name__)

_ALPHABET = string.ascii_letters + string.digits + "!@#$%"


def _generate_temp_password(length: int = 12) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


@router.post(
    "/invite-organisation",
    response_model=InviteOrganisationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a new organisation (SuperAdmin only)",
)
def invite_organisation(payload: InviteOrganisationRequest, db: Session = Depends(get_db)):
    """Create an organisation invite and send credentials to the admin email."""

    existing = (
        db.query(OrganisationInvite)
        .filter(
            OrganisationInvite.admin_email == payload.admin_email,
            OrganisationInvite.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A pending invite already exists for {payload.admin_email}",
        )

    temp_password = _generate_temp_password()
    login_url = f"{settings.frontend_url}/auth/login"

    invite = OrganisationInvite(
        organisation_name=payload.organisation_name,
        admin_name=payload.admin_name,
        admin_email=payload.admin_email,
        temp_password=temp_password,
        status="pending",
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    sent = send_organisation_invite(
        admin_email=payload.admin_email,
        admin_name=payload.admin_name,
        organisation_name=payload.organisation_name,
        temp_password=temp_password,
        login_url=login_url,
    )

    if not sent:
        logger.warning(
            "Invite record created (id=%s) but email delivery failed for %s",
            invite.id,
            payload.admin_email,
        )

    logger.info(
        "Organisation invite created: id=%s org=%r email=%s email_sent=%s",
        invite.id,
        payload.organisation_name,
        payload.admin_email,
        sent,
    )
    return invite


@router.get(
    "/invites",
    response_model=InviteListResponse,
    summary="List all organisation invites",
)
def list_invites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(OrganisationInvite).order_by(OrganisationInvite.created_at.desc())
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return InviteListResponse(total=total, items=items)


@router.get(
    "/organisations",
    summary="List all organisations with invite metadata",
)
def list_organisations_summary(db: Session = Depends(get_db)):
    orgs = db.query(Organisation).order_by(Organisation.created_at.desc()).all()
    invites = db.query(OrganisationInvite).all()
    invite_map: dict[str, str] = {}
    for inv in invites:
        invite_map[inv.organisation_name.lower()] = inv.status

    result = []
    for org in orgs:
        result.append(
            {
                "id": org.id,
                "organisation_name": org.organisation_name,
                "country": org.country,
                "industry_sector": org.industry_sector,
                "number_of_employees": org.number_of_employees,
                "invite_status": invite_map.get(org.organisation_name.lower(), "no_invite"),
                "created_at": org.created_at,
            }
        )
    return {"total": len(result), "items": result}


@router.patch(
    "/invites/{invite_id}/status",
    response_model=InviteOrganisationResponse,
    summary="Update invite status",
)
def update_invite_status(
    invite_id: int,
    new_status: str,
    db: Session = Depends(get_db),
):
    if new_status not in ("pending", "accepted", "expired"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    invite = db.query(OrganisationInvite).filter(OrganisationInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    invite.status = new_status
    db.commit()
    db.refresh(invite)
    return invite
