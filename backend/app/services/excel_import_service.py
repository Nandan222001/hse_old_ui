"""
Parse an uploaded HSE Intelligence Excel workbook and bulk-insert every
sheet into the database in FK-safe order.

All string ID prefixes (ORG001, SITE001, EMP001, STN001 …) are stripped to
plain integers before insertion.
"""

import re
import logging
from io import BytesIO
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

try:
    import openpyxl
except ImportError:
    openpyxl = None  # type: ignore

logger = logging.getLogger(__name__)


# ── helpers ──────────────────────────────────────────────────────────────────

def _strip_id(val) -> Optional[int]:
    """Strip alphabetic prefix → int, or None."""
    if val is None:
        return None
    m = re.search(r"(\d+)$", str(val).strip())
    return int(m.group(1)) if m else None


def _fmt_date(val) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()[:10]
    return s if s else None


def _fmt_datetime(val) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    if len(s) == 16:
        s += ":00"
    return s if s else None


def _fmt_time(val) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    # Excel may return a full datetime string; take last HH:MM or HH:MM:SS
    if len(s) > 8:
        s = s[-8:]
    return s if s else None


def _rows(ws):
    all_rows = list(ws.iter_rows(values_only=True))
    return all_rows[1:] if all_rows else []


def _check_sheet(wb, name: str) -> bool:
    return name in wb.sheetnames


# ── per-table insert functions ────────────────────────────────────────────────

def _insert_organisation(db: Session, wb) -> int:
    if not _check_sheet(wb, "Organisation"):
        return 0
    count = 0
    for r in _rows(wb["Organisation"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO organisation
                 (organisation_name,country,industry_sector,number_of_employees,
                  headquarters_location,parent_company,iso_45001_status,
                  regulatory_authority,establishment_date)
                 VALUES (:n,:c,:i,:ne,:hl,:pc,:iso,:ra,:ed)"""),
            dict(n=r[1], c=r[2], i=r[3], ne=r[4], hl=r[5],
                 pc=r[6], iso=r[7], ra=r[8], ed=_fmt_date(r[9])),
        )
        count += 1
    return count


def _insert_hazard_categories(db: Session, wb) -> int:
    if not _check_sheet(wb, "Hazard_Categories"):
        return 0
    count = 0
    for r in _rows(wb["Hazard_Categories"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("INSERT INTO hazard_categories (category_name,description) VALUES (:n,:d)"),
            dict(n=r[1], d=r[2]),
        )
        count += 1
    return count


def _insert_hazards(db: Session, wb) -> int:
    if not _check_sheet(wb, "Hazards"):
        return 0
    count = 0
    for r in _rows(wb["Hazards"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("INSERT INTO hazards (category_id,hazard_name,severity,probability) VALUES (:c,:n,:s,:p)"),
            dict(c=_strip_id(r[1]), n=r[2], s=r[3], p=r[4]),
        )
        count += 1
    return count


def _insert_roles(db: Session, wb) -> int:
    if not _check_sheet(wb, "Roles"):
        return 0
    count = 0
    for r in _rows(wb["Roles"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO roles (role_name,job_category,authority_level,
                 permit_authority,safety_signatory) VALUES (:n,:jc,:al,:pa,:ss)"""),
            dict(n=r[1], jc=r[2], al=r[3], pa=r[4], ss=r[5]),
        )
        count += 1
    return count


def _insert_sites(db: Session, wb) -> int:
    if not _check_sheet(wb, "Sites"):
        return 0
    count = 0
    for r in _rows(wb["Sites"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO sites
                 (site_name,address,postcode,city,type,operational_status,
                  number_of_working_stations,capacity,primary_products,hazard_classification)
                 VALUES (:sn,:a,:p,:c,:t,:os,:nws,:cap,:pp,:hc)"""),
            dict(sn=r[1], a=r[2], p=r[3], c=r[4], t=r[5], os=r[6],
                 nws=r[7], cap=r[8], pp=r[9], hc=r[10]),
        )
        count += 1
    return count


def _insert_permit_types(db: Session, wb) -> int:
    if not _check_sheet(wb, "Permit_Types"):
        return 0
    count = 0
    for r in _rows(wb["Permit_Types"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO permit_types
                 (permit_type_name,risk_level,validity_period_hours,concurrent_limit)
                 VALUES (:n,:rl,:vph,:cl)"""),
            dict(n=r[1], rl=r[2], vph=r[3], cl=r[4]),
        )
        count += 1
    return count


def _insert_training_programs(db: Session, wb) -> int:
    if not _check_sheet(wb, "Training_Programs"):
        return 0
    count = 0
    for r in _rows(wb["Training_Programs"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO training_programs
                 (training_name,duration_hours,frequency,certification,expiry_months)
                 VALUES (:n,:dh,:f,:cert,:em)"""),
            dict(n=r[1], dh=r[2], f=r[3], cert=r[4], em=r[5]),
        )
        count += 1
    return count


def _insert_policies(db: Session, wb) -> int:
    if not _check_sheet(wb, "Policies"):
        return 0
    count = 0
    for r in _rows(wb["Policies"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("INSERT INTO policies (policy_name,category,issue_date,owner,status) VALUES (:n,:c,:id,:o,:s)"),
            dict(n=r[1], c=r[2], id=_fmt_date(r[3]), o=r[4], s=r[5]),
        )
        count += 1
    return count


def _insert_departments(db: Session, wb) -> int:
    """Insert departments without manager_id (circular FK with employees)."""
    if not _check_sheet(wb, "Departments"):
        return 0
    count = 0
    for r in _rows(wb["Departments"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("INSERT INTO departments (site_id,department_name,number_of_teams) VALUES (:sid,:n,:nt)"),
            dict(sid=r[1], n=r[2], nt=r[4]),
        )
        count += 1
    return count


def _insert_working_stations(db: Session, wb) -> int:
    if not _check_sheet(wb, "Working_Stations"):
        return 0
    count = 0
    for r in _rows(wb["Working_Stations"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO working_stations
                 (station_name,site_id,department,zone_classification,
                  primary_hazard_id,staffing_requirement,equipment_list,
                  permit_types_required,access_restrictions)
                 VALUES (:sn,:sid,:d,:zc,:phi,:sr,:el,:ptr,:ar)"""),
            dict(sn=r[1], sid=_strip_id(r[2]), d=r[3], zc=r[4],
                 phi=_strip_id(r[5]), sr=r[6], el=r[7], ptr=r[8], ar=r[9]),
        )
        count += 1
    return count


def _insert_employees(db: Session, wb) -> int:
    if not _check_sheet(wb, "Employees"):
        return 0
    count = 0
    for r in _rows(wb["Employees"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO employees
                 (full_name,date_of_birth,gender,employment_type,employment_start_date,
                  role_id,department_id,shift_pattern,manager_id,induction_date,active_status)
                 VALUES (:fn,:dob,:g,:et,:esd,:rid,:did,:sp,:mid,:ind,:as_)"""),
            dict(fn=r[1], dob=_fmt_date(r[2]), g=r[3], et=r[4],
                 esd=_fmt_date(r[5]),
                 rid=_strip_id(r[6]),
                 did=_strip_id(r[7]),
                 sp=r[8],
                 mid=_strip_id(r[9]) if r[9] else None,
                 ind=_fmt_date(r[10]),
                 as_=r[11]),
        )
        count += 1
    return count


def _update_department_managers(db: Session, wb) -> int:
    if not _check_sheet(wb, "Departments"):
        return 0
    count = 0
    for r in _rows(wb["Departments"]):
        if not any(c for c in r):
            continue
        dept_id = int(r[0]) if r[0] is not None else None
        mgr_id = _strip_id(r[3]) if r[3] else None
        if dept_id and mgr_id:
            db.execute(
                text("UPDATE departments SET manager_id = :mid WHERE id = :did"),
                dict(mid=mgr_id, did=dept_id),
            )
            count += 1
    return count


def _insert_permits_to_work(db: Session, wb) -> int:
    if not _check_sheet(wb, "Permits_To_Work"):
        return 0
    count = 0
    for r in _rows(wb["Permits_To_Work"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO permits_to_work
                 (permit_type_id,date_issued,time_issued,location_station_id,
                  work_description,duration_requested_hours,issued_by,approved_by,
                  validity_start,validity_end,work_start_actual,work_end_actual,
                  number_of_workers,status,deviation_reported,incident_occurred)
                 VALUES (:ptid,:di,:ti,:lsid,:wd,:drh,:ib,:ab,:vs,:ve,:wsa,:wea,:nw,:st,:dr,:io)"""),
            dict(ptid=_strip_id(r[1]), di=_fmt_date(r[2]), ti=_fmt_time(r[3]),
                 lsid=_strip_id(r[4]), wd=r[5], drh=r[6],
                 ib=_strip_id(r[7]), ab=_strip_id(r[8]),
                 vs=_fmt_datetime(r[9]), ve=_fmt_datetime(r[10]),
                 wsa=_fmt_datetime(r[11]), wea=_fmt_datetime(r[12]),
                 nw=r[13], st=r[14], dr=r[15], io=r[16]),
        )
        count += 1
    return count


def _insert_incidents(db: Session, wb) -> int:
    if not _check_sheet(wb, "Incidents"):
        return 0
    count = 0
    for r in _rows(wb["Incidents"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO incidents
                 (report_date,incident_date_time,location_station_id,incident_type,
                  severity,number_persons_involved,description,immediate_cause,
                  root_cause,hazard_id,permit_active,control_failure,reported_by,
                  investigation_status,capa_generated,days_away,root_cause_category)
                 VALUES (:rd,:idt,:lsid,:it,:sev,:npi,:desc,:ic,:rc,:hid,:pa,:cf,:rb,:is_,:cg,:da,:rcc)"""),
            dict(rd=_fmt_date(r[1]), idt=_fmt_datetime(r[2]),
                 lsid=_strip_id(r[3]), it=r[4], sev=r[5], npi=r[6],
                 desc=r[7], ic=r[8], rc=r[9], hid=_strip_id(r[10]),
                 pa=r[11], cf=r[12], rb=_strip_id(r[13]),
                 is_=r[14], cg=r[15], da=r[16] or 0, rcc=r[17]),
        )
        count += 1
    return count


def _insert_near_misses(db: Session, wb) -> int:
    if not _check_sheet(wb, "Near_Misses"):
        return 0
    count = 0
    for r in _rows(wb["Near_Misses"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO near_misses
                 (report_date,event_date_time,location_station_id,description,
                  potential_consequence,hazard_id,underlying_cause,control_failure,
                  reported_by,capa_escalation)
                 VALUES (:rd,:edt,:lsid,:desc,:pc,:hid,:uc,:cf,:rb,:ce)"""),
            dict(rd=_fmt_date(r[1]), edt=_fmt_datetime(r[2]),
                 lsid=_strip_id(r[3]), desc=r[4], pc=r[5],
                 hid=_strip_id(r[6]), uc=r[7], cf=r[8],
                 rb=_strip_id(r[9]), ce=r[10]),
        )
        count += 1
    return count


def _insert_safety_walks(db: Session, wb) -> int:
    if not _check_sheet(wb, "Safety_Walks"):
        return 0
    count = 0
    for r in _rows(wb["Safety_Walks"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO safety_walks
                 (inspection_date_time,location_station_id,inspector_id,
                  inspection_type,issues_found,critical_issues,
                  housekeeping_rating,compliance_rating,follow_up_required)
                 VALUES (:idt,:lsid,:iid,:it,:if_,:ci,:hr,:cr,:fur)"""),
            dict(idt=_fmt_datetime(r[1]), lsid=_strip_id(r[2]),
                 iid=_strip_id(r[3]), it=r[4], if_=r[5] or 0,
                 ci=r[6] or 0, hr=r[7], cr=r[8], fur=r[9]),
        )
        count += 1
    return count


def _insert_capa_actions(db: Session, wb) -> int:
    if not _check_sheet(wb, "CAPA_Actions"):
        return 0
    count = 0
    for r in _rows(wb["CAPA_Actions"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO capa_actions
                 (incident_id,action_type,description,root_cause_addressed,
                  responsible_person_id,due_date,status,effectiveness_rating)
                 VALUES (:iid,:at,:desc,:rca,:rpid,:dd,:st,:er)"""),
            dict(iid=_strip_id(r[1]), at=r[2], desc=r[3], rca=r[4],
                 rpid=_strip_id(r[5]), dd=_fmt_date(r[6]),
                 st=r[7], er=r[8]),
        )
        count += 1
    return count


def _insert_shift_schedule(db: Session, wb) -> int:
    if not _check_sheet(wb, "Shift_Schedule"):
        return 0
    count = 0
    for r in _rows(wb["Shift_Schedule"]):
        if not any(c for c in r):
            continue
        db.execute(
            text("""INSERT INTO shift_schedule
                 (employee_id,shift_date,shift_type,shift_start,shift_end,
                  actual_hours_worked,station_id,supervisor_id)
                 VALUES (:eid,:sd,:st,:ss,:se,:ahw,:stid,:supid)"""),
            dict(eid=_strip_id(r[1]), sd=_fmt_date(r[2]),
                 st=r[3], ss=_fmt_time(r[4]), se=_fmt_time(r[5]),
                 ahw=r[6], stid=_strip_id(r[7]), supid=_strip_id(r[8])),
        )
        count += 1
    return count


# ── public entry point ────────────────────────────────────────────────────────

SHEET_STEPS = [
    ("Organisation",          "organisation",       _insert_organisation),
    ("Hazard_Categories",     "hazard_categories",  _insert_hazard_categories),
    ("Hazards",               "hazards",            _insert_hazards),
    ("Roles",                 "roles",              _insert_roles),
    ("Sites",                 "sites",              _insert_sites),
    ("Permit_Types",          "permit_types",       _insert_permit_types),
    ("Training_Programs",     "training_programs",  _insert_training_programs),
    ("Policies",              "policies",           _insert_policies),
    ("Departments",           "departments",        _insert_departments),
    ("Working_Stations",      "working_stations",   _insert_working_stations),
    ("Employees",             "employees",          _insert_employees),
    ("Departments (managers)","dept_managers",      _update_department_managers),
    ("Permits_To_Work",       "permits_to_work",    _insert_permits_to_work),
    ("Incidents",             "incidents",          _insert_incidents),
    ("Near_Misses",           "near_misses",        _insert_near_misses),
    ("Safety_Walks",          "safety_walks",       _insert_safety_walks),
    ("CAPA_Actions",          "capa_actions",       _insert_capa_actions),
    ("Shift_Schedule",        "shift_schedule",     _insert_shift_schedule),
]


def import_excel(file_bytes: bytes, db: Session) -> dict:
    """Parse the uploaded Excel workbook and insert all sheets into the DB.

    Returns a dict of {table_key: row_count} for each processed sheet.
    Raises ValueError if the file can't be parsed or a required sheet is missing.
    """
    if openpyxl is None:
        raise RuntimeError("openpyxl is not installed")

    try:
        wb = openpyxl.load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    except Exception as exc:
        raise ValueError(f"Cannot open Excel file: {exc}") from exc

    results: dict[str, int] = {}
    errors: dict[str, str] = {}

    for sheet_label, table_key, fn in SHEET_STEPS:
        try:
            count = fn(db, wb)
            results[table_key] = count
            logger.info("Imported %s rows into %s", count, table_key)
        except Exception as exc:
            logger.error("Error importing %s: %s", sheet_label, exc, exc_info=True)
            errors[table_key] = str(exc)
            db.rollback()

    if errors:
        raise ValueError(f"Import errors in sheets: {errors}")

    db.commit()
    wb.close()
    return results
