"""
AI Chat endpoint — powered by Anthropic Claude.

Falls back gracefully when ANTHROPIC_API_KEY is not set, so the
rest of the app keeps working even without an AI key configured.
"""
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import get_settings
from app.core.dependencies import get_current_user, CurrentUser
from app.utils.logger import get_logger

from app.controllers.dashboard import get_dashboard_stats, get_leading_indicators
from app.controllers.analytics import get_compliance_summary, get_risk_summary, get_violations_summary
from app.controllers.vendor import get_vendor_summary

router = APIRouter(prefix="/ai", tags=["AI"])
logger = get_logger(__name__)


def _build_project_briefing(db: Session, current_user: CurrentUser) -> str:
    """Assemble a real, DB-backed snapshot of this org's HSE data for the AI to
    reason over — reuses the exact same query logic already shown on the
    Dashboard/Compliance/Vendors/Violations pages, so the AI's answers stay
    consistent with what the user sees on screen instead of a handful of numbers
    typed into the chat box."""
    lines: list[str] = [f"=== LIVE HSE DATA SNAPSHOT for {current_user.email} (org_id={current_user.org_id}) ==="]

    try:
        stats = get_dashboard_stats(start_date=None, end_date=None, db=db, current_user=current_user)
        lines.append(
            "\n[Overview]\n"
            f"Total incidents: {stats['total_incidents']} | Critical incidents (Fatal/Serious/Significant): {stats['critical_incidents']}\n"
            f"Near misses: {stats['near_misses_count']} | Safety walks logged: {stats['safety_walks_count']}\n"
            f"Employees: {stats['total_employees']} | Sites: {stats['total_sites']} | Active permits: {stats['active_permits']}\n"
            f"Open CAPA actions: {stats['open_capa_actions']} (overdue: {stats['overdue_capa']}) | CAPA closure rate: {stats['capa_completion_rate']}%\n"
            f"Avg safety walk compliance rating: {stats['avg_compliance_rating']}/5 | Avg housekeeping rating: {stats['avg_housekeeping_rating']}/5"
        )
    except Exception as exc:
        logger.warning("Briefing: dashboard stats failed: %s", exc)

    try:
        leading = get_leading_indicators(start_date=None, end_date=None, db=db, current_user=current_user)
        if leading.get("contractor_has_contractors", True):
            contractor_text = f"{leading['contractor_risk_label']} ({leading['contractor_risk_score_10']}/10)"
        else:
            contractor_text = "N/A (no contractor workforce recorded)"
        lines.append(
            "\n[Leading Indicators]\n"
            f"Predictive injury risk score: {leading['predictive_injury_risk_score']} (trend {leading['predictive_injury_risk_trend']:+})\n"
            f"TRIR: {leading['trir']} | LTIFR: {leading['ltifr']} | DART: {leading['dart_rate']} | FAR: {leading['far']}\n"
            f"Near miss ratio: {leading['near_miss_ratio']}\n"
            f"Contractor risk: {contractor_text}\n"
            f"Audit readiness: {leading['audit_readiness_score']}% ({leading['audit_readiness_label']})"
        )
    except Exception as exc:
        logger.warning("Briefing: leading indicators failed: %s", exc)

    try:
        compliance = get_compliance_summary(db=db, current_user=current_user)
        loto_text = (
            f"{compliance['loto_compliance_pct']}%"
            if compliance.get("loto_compliance_pct") is not None
            else "no lockout permits recorded"
        )
        lines.append(
            "\n[Compliance]\n"
            f"Permit (PTW) compliance: {compliance['permit_compliance_pct']}%\n"
            f"LOTO compliance: {loto_text}\n"
            f"Corrective action closure rate: {compliance['corrective_action_closure_rate']}%\n"
            f"Policy review status: {compliance['policy_review_pct']}% current"
        )
    except Exception as exc:
        logger.warning("Briefing: compliance summary failed: %s", exc)

    try:
        risk = get_risk_summary(db=db, current_user=current_user)
        zones = ", ".join(f"{z['zone']} ({z['value']} incidents)" for z in risk.get("zone_risk", [])[:5]) or "no site data"
        lines.append(
            "\n[Risk & CAPA]\n"
            f"Open CAPA actions: {risk['kpis']['unverified_controls']} | Overdue: {risk['kpis']['risk_escalations']}\n"
            f"Incidents by site: {zones}"
        )
    except Exception as exc:
        logger.warning("Briefing: risk summary failed: %s", exc)

    try:
        violations = get_violations_summary(months=6, db=db, current_user=current_user)
        top_types = ", ".join(f"{t['label']} ({t['value']})" for t in violations.get("by_type", [])[:5]) or "none"
        top_causes = ", ".join(f"{c['name']} ({c['value']})" for c in violations.get("by_root_cause", [])[:5]) or "none"
        lines.append(
            "\n[Incident Breakdown]\n"
            f"Top incident types: {top_types}\n"
            f"Top root causes: {top_causes}"
        )
    except Exception as exc:
        logger.warning("Briefing: violations summary failed: %s", exc)

    try:
        vendor = get_vendor_summary(db=db, current_user=current_user)
        rscore = vendor["risk_score"]
        rscore_text = "N/A (no contractors)" if not rscore.get("has_contractors", True) else f"{rscore['value']}/10"
        lines.append(
            "\n[Contractors]\n"
            f"Contractors tracked: {vendor['total_contractors']} | Contractor risk score: {rscore_text}\n"
            f"Compliance breakdown: " + ", ".join(f"{c['name']} {c['value']}%" for c in vendor.get("compliance", []))
        )
    except Exception as exc:
        logger.warning("Briefing: vendor summary failed: %s", exc)

    lines.append(
        "\n=== END SNAPSHOT — use only the numbers above; do not invent figures not shown here. "
        "If asked about something not covered (e.g. training completion, medical fitness, JSA), say the data "
        "isn't tracked yet rather than guessing. ==="
    )
    return "\n".join(lines)

# ── HSE system prompt ─────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are an expert HSE (Health, Safety & Environment) intelligence assistant
embedded inside a safety management platform. Your role is to help HSE managers,
supervisors and safety teams interpret their incident data, identify risks, and
take action to prevent harm.

Every message includes a LIVE HSE DATA SNAPSHOT block with real figures pulled directly
from this organisation's database (incidents, CAPA, compliance, contractor risk, etc.).

Guidelines:
- Be concise, practical and action-oriented.
- Use markdown formatting (headings, bullet lists, short tables) for readability.
- Ground every claim in the snapshot data — cite the specific numbers you're using.
- Never invent a figure that isn't in the snapshot. If something isn't covered
  (e.g. training completion, medical fitness, JSA records), say it isn't tracked
  yet rather than guessing or estimating a number for it.
- When asked to predict, forecast, or suggest ideas: reason from the real trends
  and ratios in the snapshot (e.g. rising incident types, overdue CAPA aging,
  low compliance areas) and clearly label predictions as estimates, not facts —
  but do give a concrete, specific answer rather than a generic disclaimer.
- Focus on leading indicators, corrective actions and preventive measures.
- Keep responses focused and under 400 words unless explicitly asked for more detail.
"""


def _call_claude(messages: list[dict], api_key: str, model: str, base_url: str = "") -> str:
    """Call Anthropic Claude API — supports both standard Anthropic and Azure AI Foundry."""
    try:
        import anthropic
    except ImportError:
        raise RuntimeError("anthropic package not installed. Run: pip install 'anthropic>=0.40.0'")

    # Azure AI Foundry uses a different endpoint + auth header
    if base_url:
        import httpx
        # Azure AI Foundry Claude requires these exact headers
        headers = {
            "api-key": api_key,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "messages-2023-12-15",
        }
        # Separate system from conversation
        system_content = _SYSTEM_PROMPT
        conversation: list[dict] = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_content += f"\n\n{content}"
            elif role in ("user", "assistant"):
                conversation.append({"role": role, "content": content})
        if not conversation or conversation[0]["role"] != "user":
            conversation.insert(0, {"role": "user", "content": "Hello"})

        payload = {
            "model": model,
            "max_tokens": 1024,
            "system": system_content,
            "messages": conversation,
        }
        # Azure AI Foundry endpoint format
        endpoint = base_url.rstrip("/") + "/v1/messages"
        logger.info("Calling Azure AI Foundry: %s", endpoint)

        response = httpx.post(endpoint, json=payload, headers=headers, timeout=30.0)
        if response.status_code == 401:
            # Try with Bearer token format as fallback
            headers_bearer = {
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
                "anthropic-version": "2023-06-01",
            }
            response = httpx.post(endpoint, json=payload, headers=headers_bearer, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        return data["content"][0]["text"] if data.get("content") else "No response."
    else:
        # Standard Anthropic
        client = anthropic.Anthropic(api_key=api_key)
        system_content = _SYSTEM_PROMPT
        conversation = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_content += f"\n\n{content}"
            elif role in ("user", "assistant"):
                conversation.append({"role": role, "content": content})
        if not conversation or conversation[0]["role"] != "user":
            conversation.insert(0, {"role": "user", "content": "Hello"})
        response = client.messages.create(
            model=model, max_tokens=1024,
            system=system_content, messages=conversation,
        )
        return response.content[0].text if response.content else "No response."


def _call_azure_openai(messages: list[dict], settings) -> str:
    """Fallback to Azure OpenAI if Claude key is missing."""
    try:
        from openai import AzureOpenAI
    except ImportError:
        raise RuntimeError("openai package is not installed. Run: pip install openai")

    client = AzureOpenAI(
        api_key=settings.azure_openai_api_key,
        api_version=settings.azure_openai_api_version,
        azure_endpoint=settings.azure_openai_endpoint,
    )

    # Inject system prompt if not already present
    has_system = any(m.get("role") == "system" for m in messages)
    if not has_system:
        messages = [{"role": "system", "content": _SYSTEM_PROMPT}] + messages

    response = client.chat.completions.create(
        model=settings.azure_openai_deployment,
        messages=messages,
        max_tokens=1024,
        temperature=0.3,
    )

    return response.choices[0].message.content or "No response generated."


@router.get("/status")
def ai_status():
    """Quick check — shows which AI provider is configured."""
    settings = get_settings()
    return {
        "anthropic_key_set": bool(settings.anthropic_api_key),
        "anthropic_base_url": settings.anthropic_base_url or "(standard Anthropic)",
        "anthropic_model": settings.anthropic_model,
        "azure_openai_configured": bool(settings.azure_openai_api_key and settings.azure_openai_endpoint),
    }


@router.post("/chat")
def ai_chat(
    payload: dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Multi-turn AI chat endpoint.

    Request body:
      { "messages": [ {"role": "user"|"assistant"|"system", "content": "..."}, ... ] }

    Response:
      { "answer": "...", "model": "claude-sonnet-4-6" | "azure-openai" | "fallback" }
    """
    messages: list[dict] = payload.get("messages", [])
    if not messages:
        single = payload.get("message") or payload.get("content") or ""
        if single:
            messages = [{"role": "user", "content": single}]

    if not messages:
        return {"answer": "No message provided.", "model": "fallback"}

    # Inject a fresh, real data snapshot on every call so the AI always answers
    # from this org's actual numbers instead of whatever (if anything) the
    # frontend happened to include in the user's message text.
    briefing = _build_project_briefing(db, current_user)
    messages = [{"role": "system", "content": briefing}] + messages

    # Always get fresh settings — bust lru_cache to pick up .env changes
    get_settings.cache_clear()
    settings = get_settings()

    # ── Try Anthropic Claude first ────────────────────────────────────────────
    if settings.anthropic_api_key:
        try:
            reply = _call_claude(
                messages,
                settings.anthropic_api_key,
                settings.anthropic_model,
                base_url=settings.anthropic_base_url,  # empty string for standard Anthropic
            )
            logger.info("AI chat via Claude (%s) for user %s", settings.anthropic_model, current_user.email)
            return {"answer": reply, "model": settings.anthropic_model}
        except Exception as exc:
            logger.warning("Claude call failed: %s — trying Azure OpenAI fallback", exc)

    # ── Fallback: Azure OpenAI ────────────────────────────────────────────────
    if settings.azure_openai_api_key and settings.azure_openai_endpoint:
        try:
            reply = _call_azure_openai(messages, settings)
            logger.info("AI chat via Azure OpenAI for user %s", current_user.email)
            return {"answer": reply, "model": "azure-openai"}
        except Exception as exc:
            logger.warning("Azure OpenAI call failed: %s", exc)

    # ── No AI provider configured ─────────────────────────────────────────────
    logger.warning("No AI provider configured — returning setup instructions")
    return {
        "answer": (
            "**AI Assistant is not yet configured.**\n\n"
            "To enable the AI advisor, add your API key to `backend/.env`:\n\n"
            "```\nANTHROPIC_API_KEY=sk-ant-...\n```\n\n"
            "Once added, restart the backend server and the assistant will be live."
        ),
        "model": "fallback",
    }
