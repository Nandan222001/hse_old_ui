from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.services.organisation import OrganisationService
from app.schemas.organisation import OrganisationCreate, OrganisationUpdate, OrganisationResponse

router = APIRouter(prefix="/organisations", tags=["Organisations"])


def _svc(db: Session = Depends(get_db)) -> OrganisationService:
    return OrganisationService(db)


@router.get("/me", response_model=OrganisationResponse)
def get_my_organisation(
    svc: OrganisationService = Depends(_svc),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return the organisation for the currently authenticated user."""
    return svc.get(current_user.org_id)


@router.get("/", response_model=list[OrganisationResponse])
def list_organisations(skip: int = 0, limit: int = 100, svc: OrganisationService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=OrganisationResponse)
def get_organisation(id: int, svc: OrganisationService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=OrganisationResponse, status_code=status.HTTP_201_CREATED)
def create_organisation(payload: OrganisationCreate, svc: OrganisationService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=OrganisationResponse)
def update_organisation(id: int, payload: OrganisationUpdate, svc: OrganisationService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organisation(id: int, svc: OrganisationService = Depends(_svc)):
    svc.delete(id)
