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

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "ok", "version": settings.app_version}

    return app


app = create_app()
