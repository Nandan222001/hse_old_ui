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

router = APIRouter(prefix="/ai", tags=["AI"])
logger = get_logger(__name__)

# ── HSE system prompt ─────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are an expert HSE (Health, Safety & Environment) intelligence assistant
embedded inside a safety management platform. Your role is to help HSE managers,
supervisors and safety teams interpret their incident data, identify risks, and
take action to prevent harm.

Guidelines:
- Be concise, practical and action-oriented.
- Use markdown formatting (headings, bullet lists, short tables) for readability.
- When data is provided in the user message, reference it specifically.
- Focus on leading indicators, corrective actions and preventive measures.
- Never make up numbers — only use data provided in the conversation.
- Keep responses focused and under 400 words unless explicitly asked for more detail.
"""


def _call_claude(messages: list[dict], api_key: str, model: str, base_url: str = "") -> str:
    """Call Anthropic Claude API and return the assistant reply text.

    Supports both:
    - Standard Anthropic (api_key = sk-ant-...)
    - Azure AI Foundry (api_key = Azure key, base_url = Azure endpoint)
    """
    try:
        import anthropic
    except ImportError:
        raise RuntimeError("anthropic package is not installed. Run: pip install anthropic")

    # Azure AI Foundry uses a custom base_url and passes the key as api-key header
    if base_url:
        client = anthropic.Anthropic(
            api_key=api_key,
            base_url=base_url,
            default_headers={"api-key": api_key},
        )
    else:
        client = anthropic.Anthropic(api_key=api_key)

    # Separate system messages from conversation messages
    system_content = _SYSTEM_PROMPT
    conversation: list[dict] = []

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "system":
            system_content += f"\n\n{content}"
        elif role in ("user", "assistant"):
            conversation.append({"role": role, "content": content})

    # Ensure conversation starts with a user message (Claude requirement)
    if not conversation or conversation[0]["role"] != "user":
        conversation.insert(0, {"role": "user", "content": "Hello"})

    response = client.messages.create(
        model=model,
        max_tokens=1024,
        system=system_content,
        messages=conversation,
    )

    return response.content[0].text if response.content else "No response generated."


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
