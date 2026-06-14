from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.incident import Incident
from app.models.capa_action import CapaAction
from app.models.permit_to_work import PermitToWork
from app.models.employee import Employee
from app.models.site import Site
from app.models.near_miss import NearMiss
from app.models.safety_walk import SafetyWalk

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Return aggregated HSE dashboard statistics."""
    total_incidents = db.query(Incident).count()
    open_capa_actions = db.query(CapaAction).filter(CapaAction.status != "Completed").count()
    active_permits = db.query(PermitToWork).filter(PermitToWork.status == "Active").count()
    total_employees = db.query(Employee).count()
    total_sites = db.query(Site).count()
    near_misses_count = db.query(NearMiss).count()
    safety_walks_count = db.query(SafetyWalk).count()

    return {
        "total_incidents": total_incidents,
        "open_capa_actions": open_capa_actions,
        "active_permits": active_permits,
        "total_employees": total_employees,
        "total_sites": total_sites,
        "near_misses_count": near_misses_count,
        "safety_walks_count": safety_walks_count,
    }
