"""
Site security & monitoring infrastructure: CCTV cameras, RFID gate readers +
access logs, and edge-AI devices.

Unlike the HSE workflow domains (incidents, permits, checklists...), this data
does not come from a worker/supervisor/manager mobile app — it's physical
hardware telemetry (cameras, gate controllers, edge servers). Rows are either
registered by an admin here, or pushed by a future device-integration/gateway
service calling these same endpoints with a service account.
"""
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.cctv_camera import CctvCamera
from app.models.rfid_reader import RfidReader
from app.models.rfid_access_log import RfidAccessLog
from app.models.edge_device import EdgeDevice
from app.models.site import Site
from app.models.working_station import WorkingStation
from app.models.employee import Employee

router = APIRouter(tags=["Site Security & Devices"])


def _site_zone_maps(db: Session, site_ids: set, zone_ids: set) -> tuple[Dict[int, str], Dict[int, str]]:
    site_map: Dict[int, str] = {}
    if site_ids:
        for s in db.query(Site).filter(Site.id.in_(site_ids)).all():
            site_map[s.id] = s.site_name
    zone_map: Dict[int, str] = {}
    if zone_ids:
        for z in db.query(WorkingStation).filter(WorkingStation.id.in_(zone_ids)).all():
            zone_map[z.id] = z.station_name
    return site_map, zone_map


# ══════════════════════════════════════════════════════════════════════════════
# CCTV Cameras
# ══════════════════════════════════════════════════════════════════════════════

class CameraCreate(BaseModel):
    camera_name: str
    site_id: Optional[int] = None
    zone_id: Optional[int] = None
    ip_address: Optional[str] = None
    protocol: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    installed_date: Optional[date] = None
    status: str = "Active"


def _camera_response(c: CctvCamera, site_map: Dict[int, str], zone_map: Dict[int, str]) -> dict:
    return {
        "Camera_ID": f"CAM-{c.id:04d}",
        "Camera_Name": c.camera_name,
        "Zone_ID": zone_map.get(c.zone_id, "—"),
        "Site_ID": site_map.get(c.site_id, "—"),
        "IP_Address": c.ip_address or "",
        "Protocol": c.protocol or "",
        "Resolution": c.resolution or "",
        "FPS": c.fps,
        "Installed_Date": c.installed_date.isoformat() if c.installed_date else "",
        "Status": c.status,
        "Last_Maintenance": c.last_maintenance.isoformat() if c.last_maintenance else "",
    }


@router.get("/cameras")
def list_cameras(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id
    q = db.query(CctvCamera)
    if org_id is not None:
        q = q.filter(CctvCamera.organisation_id == org_id)
    rows = q.order_by(CctvCamera.camera_name.asc()).all()
    site_map, zone_map = _site_zone_maps(
        db, {r.site_id for r in rows if r.site_id}, {r.zone_id for r in rows if r.zone_id}
    )
    return [_camera_response(r, site_map, zone_map) for r in rows]


@router.post("/cameras", status_code=status.HTTP_201_CREATED)
def create_camera(payload: CameraCreate, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    camera = CctvCamera(organisation_id=current_user.org_id, **payload.model_dump())
    db.add(camera)
    db.commit()
    db.refresh(camera)
    site_map, zone_map = _site_zone_maps(db, {camera.site_id} if camera.site_id else set(), {camera.zone_id} if camera.zone_id else set())
    return _camera_response(camera, site_map, zone_map)


@router.delete("/cameras/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(camera_id: int, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id
    q = db.query(CctvCamera).filter(CctvCamera.id == camera_id)
    if org_id is not None:
        q = q.filter(CctvCamera.organisation_id == org_id)
    camera = q.first()
    if camera:
        db.delete(camera)
        db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# RFID Readers + Access Log
# ══════════════════════════════════════════════════════════════════════════════

class RfidReaderCreate(BaseModel):
    gate_name: str
    site_id: Optional[int] = None
    zone_id: Optional[int] = None
    reader_type: Optional[str] = None
    status: str = "Active"


def _reader_response(r: RfidReader, zone_map: Dict[int, str], reads_today: int) -> dict:
    return {
        "RFID_ID": f"RFID-{r.id:04d}",
        "Gate_Name": r.gate_name,
        "Zone_ID": zone_map.get(r.zone_id, "—"),
        "Site_ID": str(r.site_id) if r.site_id else "—",
        "Reader_Type": r.reader_type or "",
        "Last_Seen": r.last_seen.isoformat() if r.last_seen else "",
        "Status": r.status,
        "Total_Reads_Today": reads_today,
    }


@router.get("/rfid-readers")
def list_rfid_readers(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id
    q = db.query(RfidReader)
    if org_id is not None:
        q = q.filter(RfidReader.organisation_id == org_id)
    rows = q.order_by(RfidReader.gate_name.asc()).all()
    _, zone_map = _site_zone_maps(db, set(), {r.zone_id for r in rows if r.zone_id})

    today_start = datetime.combine(date.today(), datetime.min.time())
    reads_today_by_reader: Dict[int, int] = {}
    if rows:
        log_q = db.query(RfidAccessLog.reader_id, RfidAccessLog.id).filter(
            RfidAccessLog.reader_id.in_([r.id for r in rows]),
            RfidAccessLog.logged_at >= today_start,
        )
        for reader_id, _log_id in log_q.all():
            reads_today_by_reader[reader_id] = reads_today_by_reader.get(reader_id, 0) + 1

    return [_reader_response(r, zone_map, reads_today_by_reader.get(r.id, 0)) for r in rows]


@router.post("/rfid-readers", status_code=status.HTTP_201_CREATED)
def create_rfid_reader(payload: RfidReaderCreate, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    reader = RfidReader(organisation_id=current_user.org_id, **payload.model_dump())
    db.add(reader)
    db.commit()
    db.refresh(reader)
    _, zone_map = _site_zone_maps(db, set(), {reader.zone_id} if reader.zone_id else set())
    return _reader_response(reader, zone_map, 0)


class AccessLogCreate(BaseModel):
    """What a gate controller / RFID reader integration would POST on each badge scan."""
    reader_id: int
    employee_id: Optional[int] = None
    entry_type: str = "Entry"   # Entry | Exit
    result: str = "Allowed"     # Allowed | Denied


@router.post("/rfid-readers/access-log", status_code=status.HTTP_201_CREATED)
def log_access(payload: AccessLogCreate, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    log = RfidAccessLog(organisation_id=current_user.org_id, **payload.model_dump())
    reader = db.query(RfidReader).filter(RfidReader.id == payload.reader_id).first()
    if reader:
        reader.last_seen = datetime.utcnow()
    db.add(log)
    db.commit()
    return {"success": True}


@router.get("/rfid-readers/access-log")
def get_access_log(limit: int = 50, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id
    q = (
        db.query(RfidAccessLog, RfidReader, Employee)
        .join(RfidReader, RfidAccessLog.reader_id == RfidReader.id)
        .outerjoin(Employee, RfidAccessLog.employee_id == Employee.id)
    )
    if org_id is not None:
        q = q.filter(RfidAccessLog.organisation_id == org_id)
    rows = q.order_by(RfidAccessLog.logged_at.desc()).limit(limit).all()
    return [
        {
            "worker": emp.full_name if emp else "Unknown",
            "gate": reader.gate_name,
            "entry": log.entry_type,
            "time": log.logged_at.strftime("%I:%M %p"),
            "result": log.result,
        }
        for log, reader, emp in rows
    ]


@router.get("/rfid-readers/gate-stats")
def get_gate_stats(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id
    today_start = datetime.combine(date.today(), datetime.min.time())
    q = (
        db.query(RfidAccessLog, RfidReader)
        .join(RfidReader, RfidAccessLog.reader_id == RfidReader.id)
        .filter(RfidAccessLog.logged_at >= today_start)
    )
    if org_id is not None:
        q = q.filter(RfidAccessLog.organisation_id == org_id)
    stats: Dict[str, Dict[str, int]] = {}
    for log, reader in q.all():
        bucket = stats.setdefault(reader.gate_name, {"entries": 0, "exits": 0})
        if log.entry_type == "Exit":
            bucket["exits"] += 1
        else:
            bucket["entries"] += 1
    return [{"gate": gate, "entries": v["entries"], "exits": v["exits"]} for gate, v in stats.items()]


# ══════════════════════════════════════════════════════════════════════════════
# Edge Devices
# ══════════════════════════════════════════════════════════════════════════════

class EdgeDeviceCreate(BaseModel):
    device_name: str
    device_type: Optional[str] = None
    site_id: Optional[int] = None
    zone_id: Optional[int] = None
    firmware_version: Optional[str] = None
    ai_model_version: Optional[str] = None
    status: str = "Online"


def _edge_response(d: EdgeDevice, site_map: Dict[int, str], zone_map: Dict[int, str]) -> dict:
    return {
        "Device_ID": f"EDG-{d.id:04d}",
        "Device_Name": d.device_name,
        "Device_Type": d.device_type or "",
        "Site_ID": site_map.get(d.site_id, "—"),
        "Zone_ID": zone_map.get(d.zone_id, "—"),
        "Firmware_Version": d.firmware_version or "",
        "AI_Model_Version": d.ai_model_version or "",
        "Last_Seen": d.last_seen.isoformat() if d.last_seen else "",
        "Status": d.status,
        "CPU_Usage": float(d.cpu_usage) if d.cpu_usage is not None else 0,
        "GPU_Usage": float(d.gpu_usage) if d.gpu_usage is not None else 0,
        "Memory_Usage": float(d.memory_usage) if d.memory_usage is not None else 0,
    }


@router.get("/edge-devices")
def list_edge_devices(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    org_id = current_user.org_id
    q = db.query(EdgeDevice)
    if org_id is not None:
        q = q.filter(EdgeDevice.organisation_id == org_id)
    rows = q.order_by(EdgeDevice.device_name.asc()).all()
    site_map, zone_map = _site_zone_maps(
        db, {r.site_id for r in rows if r.site_id}, {r.zone_id for r in rows if r.zone_id}
    )
    return [_edge_response(r, site_map, zone_map) for r in rows]


@router.post("/edge-devices", status_code=status.HTTP_201_CREATED)
def create_edge_device(payload: EdgeDeviceCreate, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    device = EdgeDevice(organisation_id=current_user.org_id, **payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    site_map, zone_map = _site_zone_maps(db, {device.site_id} if device.site_id else set(), {device.zone_id} if device.zone_id else set())
    return _edge_response(device, site_map, zone_map)
