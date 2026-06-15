from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.organisation_invite import OrganisationInvite
from app.services.excel_import_service import import_excel
from app.utils.logger import get_logger

router = APIRouter(prefix="/organisation/setup", tags=["Organisation Setup"])
logger = get_logger(__name__)

_MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.get("/check", summary="Check if an email has a pending org invite (needs setup)")
def check_setup_required(email: str, db: Session = Depends(get_db)):
    invite = (
        db.query(OrganisationInvite)
        .filter(
            OrganisationInvite.admin_email == email.strip().lower(),
            OrganisationInvite.status == "pending",
        )
        .first()
    )
    if invite:
        return {
            "needs_setup": True,
            "organisation_name": invite.organisation_name,
            "admin_name": invite.admin_name,
            "invite_id": invite.id,
        }
    return {"needs_setup": False}


@router.post(
    "/upload",
    summary="Upload organisation Excel to bulk-import all data",
    status_code=status.HTTP_200_OK,
)
async def upload_organisation_excel(
    email: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate file type
    if not (
        file.filename
        and (file.filename.endswith(".xlsx") or file.filename.endswith(".xls"))
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx / .xls files are accepted",
        )

    content = await file.read()
    if len(content) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 50 MB limit",
        )

    logger.info("Organisation Excel upload: %s bytes from %s", len(content), email)

    try:
        results = import_excel(content, db)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("Unexpected error during Excel import: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during import",
        )

    # Mark invite as accepted
    invite = (
        db.query(OrganisationInvite)
        .filter(
            OrganisationInvite.admin_email == email.strip().lower(),
            OrganisationInvite.status == "pending",
        )
        .first()
    )
    if invite:
        invite.status = "accepted"
        db.commit()
        logger.info("Invite id=%s marked accepted for %s", invite.id, email)

    total_rows = sum(v for v in results.values() if isinstance(v, int))
    return {
        "success": True,
        "message": f"Successfully imported {total_rows:,} records across {len(results)} tables",
        "total_rows": total_rows,
        "sheets": results,
    }
