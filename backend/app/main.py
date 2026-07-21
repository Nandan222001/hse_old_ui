from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.config.logging_config import configure_logging
from app.core.exceptions import (
    NotFoundError, ConflictError, ValidationError,
    not_found_handler, conflict_handler, validation_handler,
)
from app.core.middleware import RequestLoggingMiddleware

# Ensure all models are registered with SQLAlchemy metadata
import app.models  # noqa: F401

# ── Controllers ───────────────────────────────────────────────────────────────
from app.controllers import (
    organisation, site, department, working_station,
    role, employee, policy, permit_type, hazard_category,
    hazard, training_program, permit_to_work, incident,
    near_miss, safety_walk, capa_action, shift_schedule,
    auth as auth_controller, dashboard as dashboard_controller,
    superadmin as superadmin_controller,
    organisation_setup as organisation_setup_controller,
    analytics as analytics_controller,
    checklists as checklists_controller,
    stubs as stubs_controller,
    people as people_controller,
    data_management as data_management_controller,
    org_users as org_users_controller,
    equipment_certification as equipment_certification_controller,
    notification as notification_controller,
    vendor as vendor_controller,
    ai as ai_controller,
    driver as driver_controller,
    incident_workflow as incident_workflow_controller,
    near_miss_workflow as near_miss_workflow_controller,
    unsafe_act_workflow as unsafe_act_workflow_controller,
    risk_workflow as risk_workflow_controller,
    permit_workflow as permit_workflow_controller,
    hazard_register as hazard_register_controller,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.app_debug,
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request logging ───────────────────────────────────────────────────────
    app.add_middleware(RequestLoggingMiddleware)

    # ── Exception handlers ────────────────────────────────────────────────────
    app.add_exception_handler(NotFoundError,   not_found_handler)
    app.add_exception_handler(ConflictError,   conflict_handler)
    app.add_exception_handler(ValidationError, validation_handler)

    # ── Routers ───────────────────────────────────────────────────────────────
    prefix = "/api/v1"
    for router_module in [
        organisation, site, department, working_station,
        role, employee, policy, permit_type, hazard_category,
        hazard, training_program, permit_to_work, incident,
        near_miss, safety_walk, capa_action, shift_schedule,
    ]:
        app.include_router(router_module.router, prefix=prefix)

    app.include_router(auth_controller.router, prefix=prefix)
    app.include_router(dashboard_controller.router, prefix=prefix)
    app.include_router(superadmin_controller.router, prefix=prefix)
    app.include_router(organisation_setup_controller.router, prefix=prefix)
    app.include_router(analytics_controller.router, prefix=prefix)
    app.include_router(checklists_controller.router, prefix=prefix)
    app.include_router(stubs_controller.router, prefix=prefix)
    app.include_router(people_controller.router, prefix=prefix)
    app.include_router(data_management_controller.router, prefix=prefix)
    app.include_router(org_users_controller.router, prefix=prefix)
    app.include_router(equipment_certification_controller.router, prefix=prefix)
    app.include_router(notification_controller.router, prefix=prefix)
    app.include_router(vendor_controller.router, prefix=prefix)
    app.include_router(ai_controller.router, prefix=prefix)
    app.include_router(driver_controller.router, prefix=prefix)
    app.include_router(incident_workflow_controller.router, prefix=prefix)
    # Near miss / unsafe act / risk each get their own table and their own workflow.
    app.include_router(near_miss_workflow_controller.router, prefix=prefix)
    app.include_router(unsafe_act_workflow_controller.router, prefix=prefix)
    app.include_router(risk_workflow_controller.router, prefix=prefix)
    # Permit to Work (flow 6) and Hazard register (flow 5) role workflows.
    app.include_router(permit_workflow_controller.router, prefix=prefix)
    app.include_router(hazard_register_controller.router, prefix=prefix)

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "ok", "version": settings.app_version}

    return app


app = create_app()
