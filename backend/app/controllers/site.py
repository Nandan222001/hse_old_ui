from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.site import SiteService
from app.schemas.site import SiteCreate, SiteUpdate, SiteResponse

router = APIRouter(prefix="/sites", tags=["Sites"])


def _svc(db: Session = Depends(get_db)) -> SiteService:
    return SiteService(db)


@router.get("/", response_model=list[SiteResponse])
def list_sites(skip: int = 0, limit: int = 100, svc: SiteService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=SiteResponse)
def get_site(id: int, svc: SiteService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(payload: SiteCreate, svc: SiteService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=SiteResponse)
def update_site(id: int, payload: SiteUpdate, svc: SiteService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(id: int, svc: SiteService = Depends(_svc)):
    svc.delete(id)
