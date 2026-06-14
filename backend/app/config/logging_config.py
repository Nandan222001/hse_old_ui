import logging
import logging.handlers
import os
from app.config.settings import get_settings


def configure_logging() -> None:
    settings = get_settings()
    os.makedirs(settings.log_dir, exist_ok=True)

    level = getattr(logging, settings.log_level.upper(), logging.DEBUG)

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # ── Console handler ──────────────────────────────────────────────────────
    console = logging.StreamHandler()
    console.setLevel(level)
    console.setFormatter(fmt)

    # ── Rotating file handler (all logs) ─────────────────────────────────────
    app_file = logging.handlers.RotatingFileHandler(
        filename=os.path.join(settings.log_dir, "app.log"),
        maxBytes=settings.log_max_bytes,
        backupCount=settings.log_backup_count,
        encoding="utf-8",
    )
    app_file.setLevel(level)
    app_file.setFormatter(fmt)

    # ── Rotating file handler (errors only) ──────────────────────────────────
    err_file = logging.handlers.RotatingFileHandler(
        filename=os.path.join(settings.log_dir, "error.log"),
        maxBytes=settings.log_max_bytes,
        backupCount=settings.log_backup_count,
        encoding="utf-8",
    )
    err_file.setLevel(logging.ERROR)
    err_file.setFormatter(fmt)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(console)
    root.addHandler(app_file)
    root.addHandler(err_file)

    # Silence noisy third-party loggers
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.app_debug else logging.WARNING
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
