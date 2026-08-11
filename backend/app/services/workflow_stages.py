"""The one lifecycle every safety event runs through.

Source: HSE_Workflow_Engine_Slide.pptx — "One Workflow Engine. Every Safety
Event." The slide's claim is that hazards, near misses, incidents, permits and
audits all flow through the same eight stages:

    01 RECORD      capture in <60 sec
    02 ASSESS      triage — deterministic first, human sign-off where it counts
    03 RESPOND     contain and control
    04 INVESTIGATE find the root cause
    05 IMPROVE     CAPA by hierarchy of control
    06 VERIFY      confirm it worked
    07 LEARN       share the lesson
    08 CLOSE       update everything

Before this module each event type carried its own `workflow_status` vocabulary
and nothing named the stages at all, so "the same 8 stages" was a slide claim
with no code behind it. The stage is derived, not stored: `workflow_status`
remains the single source of truth that every existing query and dashboard
already reads, and the stage is computed from it. That keeps the two from
drifting apart, which is what a duplicated `stage` column would guarantee.

Permits and audits keep their own status vocabularies — they are genuinely
different processes — so they get their own mappings onto the same eight
stages rather than being forced onto the report status names.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional


# ══════════════════════════════════════════════════════════════════════════════
# The eight stages
# ══════════════════════════════════════════════════════════════════════════════

RECORD = "RECORD"
ASSESS = "ASSESS"
RESPOND = "RESPOND"
INVESTIGATE = "INVESTIGATE"
IMPROVE = "IMPROVE"
VERIFY = "VERIFY"
LEARN = "LEARN"
CLOSE = "CLOSE"


@dataclass(frozen=True)
class Stage:
    number: int
    key: str
    label: str
    description: str


STAGES: List[Stage] = [
    Stage(1, RECORD, "Record", "Capture the event in under 60 seconds."),
    Stage(2, ASSESS, "Assess", "Triage: classify severity and statutory duty."),
    Stage(3, RESPOND, "Respond", "Contain and control the immediate hazard."),
    Stage(4, INVESTIGATE, "Investigate", "Establish the root cause."),
    Stage(5, IMPROVE, "Improve", "Raise corrective actions by hierarchy of control."),
    Stage(6, VERIFY, "Verify", "Confirm the corrective action worked."),
    Stage(7, LEARN, "Learn", "Capture and share the lesson."),
    Stage(8, CLOSE, "Close", "Independent sign-off. Update everything downstream."),
]

STAGE_BY_KEY: Dict[str, Stage] = {s.key: s for s in STAGES}
STAGE_ORDER: Dict[str, int] = {s.key: s.number for s in STAGES}


# ══════════════════════════════════════════════════════════════════════════════
# Per-family status vocabularies mapped onto the eight stages
# ══════════════════════════════════════════════════════════════════════════════

# Incidents, near misses, unsafe acts and risk reports. These already share the
# ReportWorkflowMixin status set, so one mapping covers all four.
REPORT_STATUS_STAGE: Dict[str, str] = {
    "reported": ASSESS,              # recorded — awaiting triage
    "acknowledged": RESPOND,         # supervisor has taken control
    "under_investigation": INVESTIGATE,
    "escalated": INVESTIGATE,        # still being investigated, one level up
    "pending_approval": VERIFY,      # investigation done, manager confirming
    "approved": LEARN,               # confirmed, lesson to be captured on close
    "investigated": VERIFY,
    "closed": CLOSE,
}

# Permit-to-work. A permit's "investigation" is its gate evaluation and its
# "improve" step is the control set attached before issue.
#
# Read from `permits_to_work.status`, not `workflow_status`: `status` carries
# the actual permit lifecycle (Pending → Active → Expired → Closed) while
# `workflow_status` only tracks the approval chain. Keys are lowercase because
# stage_for() lowercases before lookup — the column stores Title Case.
PERMIT_STATUS_STAGE: Dict[str, str] = {
    "draft": RECORD,
    "submitted": ASSESS,
    "pending": ASSESS,
    "pending_approval": ASSESS,
    "gate_check": ASSESS,
    "gate_blocked": RESPOND,         # a failed gate is a control problem to fix
    "approved": IMPROVE,
    "issued": IMPROVE,
    "active": VERIFY,                # live work under verification
    "suspended": RESPOND,
    "expired": LEARN,
    "closed": CLOSE,
    "cancelled": CLOSE,
    "rejected": CLOSE,               # terminal — the work never proceeded
}

# Audits and inspections. Findings are the investigation, CAPAs the improvement.
AUDIT_STATUS_STAGE: Dict[str, str] = {
    "scheduled": RECORD,
    "planned": RECORD,
    "in_progress": ASSESS,
    "fieldwork": INVESTIGATE,
    "findings_raised": IMPROVE,
    "capa_open": IMPROVE,
    "pending_review": VERIFY,
    "verified": LEARN,
    "completed": CLOSE,
    "closed": CLOSE,
}

# event family -> mapping
FAMILY_MAPPINGS: Dict[str, Dict[str, str]] = {
    "incident": REPORT_STATUS_STAGE,
    "near_miss": REPORT_STATUS_STAGE,
    "unsafe_act": REPORT_STATUS_STAGE,
    "risk": REPORT_STATUS_STAGE,
    "hazard": REPORT_STATUS_STAGE,
    "permit": PERMIT_STATUS_STAGE,
    "audit": AUDIT_STATUS_STAGE,
    "inspection": AUDIT_STATUS_STAGE,
}

# The five families the slide names. Kept explicit so a dashboard can render
# them in a fixed order rather than whatever the dict yields.
EVENT_FAMILIES = ("hazard", "near_miss", "incident", "permit", "audit")


def stage_for(event_family: str, workflow_status: Optional[str]) -> Optional[str]:
    """Which of the eight stages is this record currently in?

    Returns None for an unknown status rather than guessing — a record whose
    status is not in the vocabulary is a data problem worth surfacing, not
    something to silently file under RECORD.
    """
    mapping = FAMILY_MAPPINGS.get((event_family or "").strip().lower())
    if mapping is None:
        return None
    return mapping.get((workflow_status or "").strip().lower())


def stage_number(stage_key: Optional[str]) -> Optional[int]:
    return STAGE_ORDER.get(stage_key) if stage_key else None


def describe(event_family: str, workflow_status: Optional[str]) -> dict:
    """Stage descriptor for an API response.

    `completed_stages` is what a progress bar needs: every stage strictly before
    the current one. It is derived from the stage number, not tracked
    separately, so it cannot disagree with the record's actual status.
    """
    key = stage_for(event_family, workflow_status)
    num = stage_number(key)
    stage = STAGE_BY_KEY.get(key) if key else None
    return {
        "event_family": event_family,
        "workflow_status": workflow_status,
        "stage": key,
        "stage_number": num,
        "stage_label": stage.label if stage else None,
        "stage_description": stage.description if stage else None,
        "total_stages": len(STAGES),
        "completed_stages": [s.key for s in STAGES if num and s.number < num],
        "is_closed": key == CLOSE,
    }


def catalogue() -> List[dict]:
    """The eight stages, for a client that wants to render the whole lifecycle."""
    return [
        {"number": s.number, "key": s.key, "label": s.label, "description": s.description}
        for s in STAGES
    ]
