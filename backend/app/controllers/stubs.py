"""
Stub endpoints for features that have frontend UI but no backend model yet.
These return empty/default responses so pages render gracefully rather than
showing API errors.
"""
from typing import Any
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.organisation_invite import OrganisationInvite

router = APIRouter(tags=["Stubs"])


# ── Compliance ────────────────────────────────────────────────────────────────

@router.get("/compliance-standards")
def list_compliance_standards() -> list:
    return []


@router.get("/audit-trail")
def get_audit_trail() -> list:
    return []


# ── Onboarding / Access Profile ───────────────────────────────────────────────

@router.get("/onboarding/access-profile")
def get_onboarding_access_profile(email: str = "", org_code: str = "") -> dict:
    return {"found": False, "approved": False}


@router.get("/onboarding/requests")
def list_onboarding_requests() -> list:
    return []


@router.post("/onboarding/requests")
def create_onboarding_request(payload: Any = None) -> dict:
    return {"uuid": None, "status": "pending"}


@router.delete("/onboarding/requests/{uuid}")
def delete_onboarding_request(uuid: str) -> dict:
    return {"deleted": True}


@router.get("/onboarding/requests/{uuid}")
def get_onboarding_request(uuid: str) -> dict:
    return {"uuid": uuid, "status": "pending"}


@router.patch("/onboarding/requests/{uuid}")
def update_onboarding_request(uuid: str, payload: Any = None) -> dict:
    return {"uuid": uuid, "status": "updated"}


@router.get("/onboarding/layer-options")
def get_onboarding_layer_options() -> dict:
    return {"layers": []}


@router.get("/onboarding/processing-queue")
def get_onboarding_processing_queue() -> list:
    return []


@router.post("/onboarding/theta-auth/login")
def theta_auth_login(payload: Any = None) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": "Theta auth not configured"})


@router.post("/onboarding/password-reset/theta/request")
def theta_password_reset_request(payload: Any = None) -> dict:
    return {"sent": False}


@router.post("/onboarding/password-reset/theta/confirm")
def theta_password_reset_confirm(payload: Any = None) -> dict:
    return {"confirmed": False}


@router.post("/onboarding/password-reset/theta/direct")
def theta_password_reset_direct(payload: Any = None) -> dict:
    return {"reset": False}


@router.get("/onboarding/access-requests")
def list_onboarding_access_requests() -> list:
    return []


@router.patch("/onboarding/access-requests/{uuid}")
def update_onboarding_access_request(uuid: str, payload: Any = None) -> dict:
    return {"uuid": uuid, "updated": True}


@router.post("/onboarding")
def create_onboarding(payload: Any = None) -> dict:
    return {"created": False}


# ── AI Chat ───────────────────────────────────────────────────────────────────

# ── Org Setup Wizard ─────────────────────────────────────────────────────────

@router.get("/org-setup/progress")
def org_setup_progress() -> dict:
    return {"steps_completed": [], "steps_total": 8, "percent": 0, "activated": False}

@router.get("/org-setup/step1")
def org_setup_step1_get() -> dict:
    return {}

@router.post("/org-setup/step1")
def org_setup_step1_post(payload: Any = None) -> dict:
    return {"saved": True}

@router.post("/org-setup/step1/parse-excel")
def org_setup_parse_excel(payload: Any = None) -> dict:
    return {}

@router.post("/org-setup/step1/api-connect")
def org_setup_api_connect(payload: Any = None) -> dict:
    return {"data": {}}

@router.get("/org-setup/step1/template")
def org_setup_step1_template() -> dict:
    return {}

@router.get("/org-setup/step2")
def org_setup_step2_get() -> dict:
    return {}

@router.post("/org-setup/step2")
def org_setup_step2_post(payload: Any = None) -> dict:
    return {"saved": True}

@router.get("/org-setup/step3/sites")
def org_setup_step3_sites() -> list:
    return []

@router.post("/org-setup/step3/site")
def org_setup_step3_create_site(payload: Any = None) -> dict:
    return {"id": "site-1", "name": "", "type": "", "address": "", "city": "", "operationalStatus": ""}

@router.post("/org-setup/step3/bulk")
def org_setup_step3_bulk(payload: Any = None) -> dict:
    return {"count": 0}

@router.get("/org-setup/step3/template")
def org_setup_step3_template() -> dict:
    return {}

@router.get("/org-setup/step4/users")
def org_setup_step4_users() -> list:
    return []

@router.post("/org-setup/step4/user")
def org_setup_step4_create_user(payload: Any = None) -> dict:
    return {"id": "user-1", "name": "", "email": "", "role": "", "department": ""}

@router.post("/org-setup/step4/bulk")
def org_setup_step4_bulk(payload: Any = None) -> dict:
    return {"count": 0}

@router.post("/org-setup/step4/hrms-import")
def org_setup_hrms_import(payload: Any = None) -> dict:
    return {"count": 0}

@router.get("/org-setup/step4/template")
def org_setup_step4_template() -> dict:
    return {}

@router.get("/org-setup/step5")
def org_setup_step5_get() -> dict:
    return {}

@router.post("/org-setup/step5")
def org_setup_step5_post(payload: Any = None) -> dict:
    return {"saved": True}

@router.get("/org-setup/step6/documents")
def org_setup_step6_documents() -> list:
    return []

@router.post("/org-setup/step6/upload")
def org_setup_step6_upload(payload: Any = None) -> dict:
    return {"id": "doc-1", "name": "", "type": "", "uploadedAt": "", "size": ""}

@router.get("/org-setup/step6a/imports")
def org_setup_step6a_imports() -> list:
    return []

@router.post("/org-setup/step6a/import")
def org_setup_step6a_import(payload: Any = None) -> dict:
    return {"id": "imp-1", "dataType": "", "method": "", "importedAt": "", "records": 0}

@router.post("/org-setup/onboarding-bulk")
def org_setup_onboarding_bulk(module: str = "", payload: Any = None) -> dict:
    return {"count": 0, "errors": []}

@router.get("/org-setup/step7")
def org_setup_step7_get() -> dict:
    return {}

@router.post("/org-setup/step7")
def org_setup_step7_post(payload: Any = None) -> dict:
    return {"saved": True}

@router.post("/org-setup/activate")
def org_setup_activate(request: Request, payload: Any = None, db: Session = Depends(get_db)) -> dict:
    # Resolve admin email from JWT header so we can mark the invite accepted
    email: str = request.headers.get("X-User-Email", "").strip().lower()
    if email:
        invite = (
            db.query(OrganisationInvite)
            .filter(
                OrganisationInvite.admin_email == email,
                OrganisationInvite.status == "pending",
            )
            .first()
        )
        if invite:
            invite.status = "accepted"
            db.commit()
    return {"success": True}

@router.get("/org-setup/template/{module}")
def org_setup_template_download(module: str) -> dict:
    return {}


# ── AI Chat ───────────────────────────────────────────────────────────────────

@router.post("/ai/chat")
def ai_chat(payload: Any = None) -> dict:
    return {
        "reply": "AI assistant is not configured. Please set up an AI provider to enable this feature.",
        "messages": [],
    }
