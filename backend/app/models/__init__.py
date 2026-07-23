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
from app.models.unsafe_act import UnsafeAct
from app.models.risk_report import RiskReport
from app.models.safety_walk import SafetyWalk
from app.models.capa_action import CapaAction
from app.models.shift_schedule import ShiftSchedule
from app.models.app_role import AppRole
from app.models.user import User
from app.models.organisation_invite import OrganisationInvite
from app.models.subscription import Subscription
from app.models.notification import Notification
from app.models.notification_read import NotificationRead
from app.models.data_import import DataImport
from app.models.validation_log import ValidationLog
from app.models.api_integration import ApiIntegration
from app.models.document import Document
from app.models.equipment_certification import EquipmentCertification
from app.models.api_key import ApiKey
from app.models.webhook import Webhook
from app.models.audit_log import AuditLog
from app.models.cctv_camera import CctvCamera
from app.models.rfid_reader import RfidReader
from app.models.rfid_access_log import RfidAccessLog
from app.models.edge_device import EdgeDevice

__all__ = [
    "Base", "Organisation", "HazardCategory", "Hazard", "Role",
    "Site", "PermitType", "TrainingProgram", "Policy", "Department",
    "WorkingStation", "Employee", "PermitToWork", "Incident", "NearMiss",
    "UnsafeAct", "RiskReport",
    "SafetyWalk", "CapaAction", "ShiftSchedule", "AppRole", "User",
    "OrganisationInvite", "Subscription", "Notification", "NotificationRead",
    "DataImport", "ValidationLog", "ApiIntegration", "Document",
    "EquipmentCertification", "ApiKey", "Webhook", "AuditLog",
    "CctvCamera", "RfidReader", "RfidAccessLog", "EdgeDevice",
]
