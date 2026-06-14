from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.hazard_category import HazardCategoryService
from app.schemas.hazard_category import HazardCategoryCreate, HazardCategoryUpdate, HazardCategoryResponse

router = APIRouter(prefix="/hazard-categorys", tags=["Hazard Categorys"])


def _svc(db: Session = Depends(get_db)) -> HazardCategoryService:
    return HazardCategoryService(db)


@router.get("/", response_model=list[HazardCategoryResponse])
def list_hazard_categorys(skip: int = 0, limit: int = 100, svc: HazardCategoryService = Depends(_svc)):
    return svc.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=HazardCategoryResponse)
def get_hazard_category(id: int, svc: HazardCategoryService = Depends(_svc)):
    return svc.get(id)


@router.post("/", response_model=HazardCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_hazard_category(payload: HazardCategoryCreate, svc: HazardCategoryService = Depends(_svc)):
    return svc.create(payload)


@router.put("/{id}", response_model=HazardCategoryResponse)
def update_hazard_category(id: int, payload: HazardCategoryUpdate, svc: HazardCategoryService = Depends(_svc)):
    return svc.update(id, payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hazard_category(id: int, svc: HazardCategoryService = Depends(_svc)):
    svc.delete(id)
