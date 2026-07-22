import hashlib
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.models.api_key import ApiKey
from app.models.webhook import Webhook
from app.models.organisation import Organisation

router = APIRouter(prefix="/org-admin/settings", tags=["Settings"])


def _org_filter(query, model, org_id):
    if org_id is not None:
        return query.filter(model.organisation_id == org_id)
    return query


# ── API Keys ────────────────────────────────────────────────────────────────────
# Keys are shown in full only once, at generation time — only a hash and a
# display prefix are ever stored, matching standard API-key handling practice.

def _api_key_to_dict(row: ApiKey) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "prefix": row.key_prefix,
        "scopes": row.scopes,
        "created_at": row.created_at.isoformat() if row.created_at else "",
        "last_used_at": row.last_used_at.isoformat() if row.last_used_at else None,
    }


@router.get("/api-keys")
def list_api_keys(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)) -> dict:
    rows = (
        _org_filter(db.query(ApiKey), ApiKey, current_user.org_id)
        .filter(ApiKey.is_active == True)
        .order_by(ApiKey.id.desc())
        .all()
    )
    return {"data": [_api_key_to_dict(r) for r in rows]}


@router.post("/api-keys")
def create_api_key(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Key name is required")
    scopes = payload.get("scopes") or "Read"

    raw_key = "hse_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    prefix = raw_key[:12] + "..."

    row = ApiKey(
        organisation_id=current_user.org_id,
        name=name,
        key_prefix=prefix,
        key_hash=key_hash,
        scopes=scopes,
        created_by=current_user.email,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    result = _api_key_to_dict(row)
    result["raw_key"] = raw_key  # only ever returned once, on creation
    return {"data": result}


@router.delete("/api-keys/{key_id}")
def revoke_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    row = (
        _org_filter(db.query(ApiKey), ApiKey, current_user.org_id)
        .filter(ApiKey.id == key_id)
        .first()
    )
    if row:
        row.is_active = False
        db.commit()
    return {"revoked": True}


# ── Webhooks ──────────────────────────────────────────────────────────────────

def _webhook_to_dict(row: Webhook) -> dict:
    return {
        "id": row.id,
        "url": row.url,
        "event_types": row.event_types,
        "is_active": row.is_active,
        "last_triggered_at": row.last_triggered_at.isoformat() if row.last_triggered_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else "",
    }


@router.get("/webhooks")
def list_webhooks(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)) -> dict:
    rows = (
        _org_filter(db.query(Webhook), Webhook, current_user.org_id)
        .filter(Webhook.is_active == True)
        .order_by(Webhook.id.desc())
        .all()
    )
    return {"data": [_webhook_to_dict(r) for r in rows]}


@router.post("/webhooks")
def create_webhook(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    url = (payload.get("url") or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Webhook URL is required")
    event_types = payload.get("event_types") or ""

    row = Webhook(
        organisation_id=current_user.org_id,
        url=url,
        event_types=event_types,
        secret=secrets.token_urlsafe(24),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"data": _webhook_to_dict(row)}


@router.delete("/webhooks/{webhook_id}")
def delete_webhook(
    webhook_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    row = (
        _org_filter(db.query(Webhook), Webhook, current_user.org_id)
        .filter(Webhook.id == webhook_id)
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
    return {"deleted": True}


# ── Branding ──────────────────────────────────────────────────────────────────

_DEFAULT_BRANDING = {"logo_url": None, "primary_color": "#1B5E20"}


@router.get("/branding")
def get_branding(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)) -> dict:
    if not current_user.org_id:
        return {"data": _DEFAULT_BRANDING}
    org = db.query(Organisation).filter(Organisation.id == current_user.org_id).first()
    if not org or not org.branding:
        return {"data": _DEFAULT_BRANDING}
    return {"data": {**_DEFAULT_BRANDING, **org.branding}}


@router.put("/branding")
def save_branding(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="No organisation on this account")
    org = db.query(Organisation).filter(Organisation.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")
    primary_color = payload.get("primary_color") or _DEFAULT_BRANDING["primary_color"]
    logo_url = payload.get("logo_url")
    org.branding = {"primary_color": primary_color, "logo_url": logo_url}
    db.commit()
    return {"data": org.branding}
