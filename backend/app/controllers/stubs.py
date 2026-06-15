"""
Stub endpoints for features that have frontend UI but no backend model yet.
These return empty/default responses so pages render gracefully rather than
showing API errors.
"""
from typing import Any
from fastapi import APIRouter
from fastapi.responses import JSONResponse

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

@router.post("/ai/chat")
def ai_chat(payload: Any = None) -> dict:
    return {
        "reply": "AI assistant is not configured. Please set up an AI provider to enable this feature.",
        "messages": [],
    }
