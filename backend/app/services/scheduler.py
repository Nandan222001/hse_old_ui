"""
Event & Trigger Engine — background jobs that act on data purely because time has
passed, without a user opening a page. Runs inside the API process via APScheduler
(no separate worker/broker needed at this scale).

Jobs:
- Checklist SLA breach detection (submit_sla_breached / validate_sla_breached columns
  already existed in the schema but nothing ever set them)
- Permit auto-expiry (Active permits whose validity_end has passed)
- Daily overdue-CAPA summary notification per organisation
"""
from datetime import datetime, date

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import func, text

from app.config.database import SessionLocal
from app.models.permit_to_work import PermitToWork
from app.models.capa_action import CapaAction
from app.models.notification import Notification
from app.services import audit_calendar, capa_scheduler
from app.utils.logger import get_logger

logger = get_logger(__name__)


def check_checklist_sla_breaches() -> None:
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        submit_result = db.execute(text("""
            UPDATE checklist_submissions
            SET submit_sla_breached = 1
            WHERE status = 'draft' AND submit_due_at IS NOT NULL
              AND submit_due_at < :now AND submit_sla_breached = 0
        """), {"now": now})
        validate_result = db.execute(text("""
            UPDATE checklist_submissions
            SET validate_sla_breached = 1
            WHERE status = 'submitted' AND validate_due_at IS NOT NULL
              AND validate_due_at < :now AND validate_sla_breached = 0
        """), {"now": now})
        db.commit()
        if submit_result.rowcount or validate_result.rowcount:
            logger.info(
                "Scheduler: flagged %s submit-SLA and %s validate-SLA checklist breaches",
                submit_result.rowcount, validate_result.rowcount,
            )
    except Exception:
        db.rollback()
        logger.exception("Scheduler: checklist SLA check failed")
    finally:
        db.close()


def expire_overdue_permits() -> None:
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        count = (
            db.query(PermitToWork)
            .filter(
                PermitToWork.status == "Active",
                PermitToWork.validity_end.isnot(None),
                PermitToWork.validity_end < now,
            )
            .update({"status": "Expired"}, synchronize_session=False)
        )
        db.commit()
        if count:
            logger.info("Scheduler: auto-expired %s permits past their validity_end", count)
    except Exception:
        db.rollback()
        logger.exception("Scheduler: permit expiry check failed")
    finally:
        db.close()


def notify_overdue_capa_summary() -> None:
    db = SessionLocal()
    try:
        today = date.today()
        rows = (
            db.query(CapaAction.organisation_id, func.count(CapaAction.id))
            .filter(
                (CapaAction.status.is_(None)) | func.lower(CapaAction.status).notin_(["completed", "closed", "verified", "done"]),
                CapaAction.due_date.isnot(None),
                CapaAction.due_date < today,
            )
            .group_by(CapaAction.organisation_id)
            .all()
        )
        today_start = datetime.combine(today, datetime.min.time())
        for org_id, overdue_count in rows:
            if not overdue_count:
                continue
            already_posted = (
                db.query(Notification)
                .filter(
                    Notification.organisation_id == org_id,
                    Notification.title == "Overdue CAPA Actions",
                    Notification.created_at >= today_start,
                )
                .first()
            )
            if already_posted:
                continue
            db.add(Notification(
                organisation_id=org_id,
                title="Overdue CAPA Actions",
                message=f"{overdue_count} corrective action(s) are past their due date and still open.",
                type="warning",
                target_type="all",
                status="sent",
                sent_at=datetime.utcnow(),
            ))
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Scheduler: CAPA overdue summary failed")
    finally:
        db.close()


_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(timezone="UTC")
    now = datetime.utcnow()
    _scheduler.add_job(check_checklist_sla_breaches, "interval", minutes=15, id="checklist_sla_check", next_run_time=now)
    _scheduler.add_job(notify_overdue_capa_summary, "interval", hours=24, id="capa_overdue_summary", next_run_time=now)

    # ── WF-04 · the CAPA chase (app.services.capa_scheduler) ──────────────────
    # Hourly for the escalation chain because a P1 action's entire life is 24
    # hours; a daily job would miss its 75% reminder altogether.
    _scheduler.add_job(
        capa_scheduler.run_capa_escalations, "interval", hours=1,
        id="capa_escalation_chain", next_run_time=now,
    )
    _scheduler.add_job(
        capa_scheduler.rescore_capa_priorities, "interval", weeks=1,
        id="capa_weekly_rescore", next_run_time=now,
    )
    _scheduler.add_job(
        capa_scheduler.notify_due_effectiveness_reviews, "interval", hours=24,
        id="capa_effectiveness_reviews", next_run_time=now,
    )
    _scheduler.add_job(
        capa_scheduler.flag_systemic_issues, "interval", hours=24,
        id="capa_systemic_flag", next_run_time=now,
    )
    # expire_overdue_permits is intentionally NOT scheduled: the current dataset's
    # permits all carry validity_end dates from 2024-2025 while the system clock is
    # 2026, so every "Active" permit reads as already-expired and the job would wipe
    # out /actions' entire "active work" view on its first run. Re-enable once
    # validity_end reflects real, currently-relevant dates.
    # ── WF-05 · "sets a reminder 14 days out" ────────────────────────────────
    # Daily is the right cadence: the reminder is stamped once per audit, so a
    # tighter sweep would find nothing new and a looser one could skip the
    # 14-day mark entirely on a short month.
    _scheduler.add_job(
        audit_calendar.run_reminder_sweep, "interval", hours=24,
        id="audit_14day_reminders", next_run_time=now,
    )
    _scheduler.start()
    logger.info(
        "Event & Trigger scheduler started (checklist SLA / CAPA summary / CAPA escalation "
        "chain / weekly re-score / effectiveness reviews / systemic flag / audit 14-day reminders; "
        "permit expiry disabled)"
    )


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
