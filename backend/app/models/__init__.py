# Import every model so SQLAlchemy's MetaData is fully populated before
# any flush/commit that involves cross-table foreign keys.
from app.models.base import Base
from app.models.organisation import Organisation
from app.models.hazard_category import HazardCategory
from app.models.hazard import Hazard
from app.models.role import Role
from app.models.site import Site
from app.models.permit_type import PermitType
from app.models.training_program import TrainingProgram
from app.models.policy import Policy
from app.models.department import Department
from app.models.working_station import WorkingStation
from app.models.employee import Employee
from app.models.permit_to_work import PermitToWork
from app.models.incident import Incident
from app.models.near_miss import NearMiss
from app.models.safety_walk import SafetyWalk
from app.models.capa_action import CapaAction
from app.models.shift_schedule import ShiftSchedule
from app.models.app_role import AppRole
from app.models.user import User
from app.models.organisation_invite import OrganisationInvite

__all__ = [
    "Base", "Organisation", "HazardCategory", "Hazard", "Role",
    "Site", "PermitType", "TrainingProgram", "Policy", "Department",
    "WorkingStation", "Employee", "PermitToWork", "Incident", "NearMiss",
    "SafetyWalk", "CapaAction", "ShiftSchedule", "AppRole", "User",
    "OrganisationInvite",
]
