"""WF-01 Flow B · the risk assessment that decides whether work can start.

Source: "Hazard Flow and Risk Flow — Two Different Journeys", Rev 5.0,
30 July 2026. Flow B is ten steps over a *planned activity*, where Flow A is
seven over a *thing that exists*. The spec's own line: you eliminate hazards,
you reduce risk.

Two rules from that document drive everything here.

**All ten categories must be answered.** "A category cannot be silently
skipped." So the ten rows are created with the assessment and the score is
refused until each has a yes or a no. Answering "no hazard here" is a real
answer and the common one; leaving it blank is not.

**The residual score decides.** Inherent is likelihood x severity before
controls, plus the four uplifts. Residual is what is left once the chosen
control is in place, and it is the residual figure the approval and the permit
gate read. `risk_reports` only ever had raw and adjusted — and adjusted is
*after uplifts*, which raise the number — so nothing in the platform had the
after-controls score the spec turns on.

Scoring itself is not reimplemented: `risk_scoring.score_risk` already holds
the 5x5 matrix, the four uplifts and the band thresholds, and is what
risk_reports and the permit gate read. One matrix, one set of bands.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.services import risk_scoring


# ══════════════════════════════════════════════════════════════════════════════
# The ten categories
# ══════════════════════════════════════════════════════════════════════════════
#
# Named by the spec, in its order: "mechanical, chemical, biological,
# ergonomic, psychosocial, fire, transport, electrical, height, confined
# space".
#
# Held here rather than read from `hazard_categories` because that table is
# per-organisation seed data and does not agree with the document — org 4 has
# "Noise/Environmental" where the spec names "Transport". A checklist the spec
# calls mandatory cannot have its contents vary by tenant, so the ten are fixed
# and `category_id` links to the tenant's own row where the names match.

@dataclass(frozen=True)
class Category:
    key: str
    name: str


CATEGORIES: List[Category] = [
    Category("mechanical", "Mechanical"),
    Category("chemical", "Chemical"),
    Category("biological", "Biological"),
    Category("ergonomic", "Ergonomic"),
    Category("psychosocial", "Psychosocial"),
    Category("fire", "Fire / Explosion"),
    Category("transport", "Transport"),
    Category("electrical", "Electrical"),
    Category("height", "Work at Height"),
    Category("confined_space", "Confined Space"),
]

CATEGORY_KEYS = [c.key for c in CATEGORIES]


# ══════════════════════════════════════════════════════════════════════════════
# The ten steps
# ══════════════════════════════════════════════════════════════════════════════
#
# Status names the state the assessment is waiting in, the same way every other
# family's does, so the step is derived from it rather than stored twice.

STATUS_STEP: Dict[str, int] = {
    "scoping": 1,            # 01 the record exists, the activity is named
    "identifying": 2,        # 02 the ten categories are being answered
    "scored": 5,             # 03-05 inherent, uplifts, band — done together
    "controls_planned": 7,   # 06-07 hierarchy chosen, owners and dates set
    "pending_approval": 8,   # 08 residual calculated, awaiting sign-off
    "approved": 9,           # 09 live, being monitored for review triggers
    "archived": 10,          # 10 closed and kept
}

STEP_LABEL: Dict[int, str] = {
    1: "Assessment started",
    2: "Ten hazard categories",
    3: "Inherent risk",
    4: "Uplift rules applied",
    5: "Band assigned",
    6: "Control hierarchy",
    7: "Owners and due dates",
    8: "Residual risk and sign-off",
    9: "Review triggers",
    10: "Archived",
}

# The spec's approval routes, read off the residual band.
ROUTE_SUPERVISOR = "Supervisor"
ROUTE_SAFETY_MANAGER = "Safety Manager"
ROUTE_EXECUTIVE = "Executive"


def step_for(status: Optional[str]) -> Optional[int]:
    return STATUS_STEP.get((status or "").strip().lower())


# ══════════════════════════════════════════════════════════════════════════════
# Completeness
# ══════════════════════════════════════════════════════════════════════════════

def unanswered(rows) -> List[str]:
    """Categories with no yes/no yet. The spec's hard stop at step 02.

    A category answered "No" is answered. Only a blank is outstanding — which
    is the whole point of forcing the ten to exist up front rather than letting
    an assessor add the ones they happen to think of.
    """
    answered = {
        (r.category_key if hasattr(r, "category_key") else r["category_key"])
        for r in rows
        if (r.hazard_present if hasattr(r, "hazard_present") else r.get("hazard_present"))
    }
    return [k for k in CATEGORY_KEYS if k not in answered]


# ══════════════════════════════════════════════════════════════════════════════
# Scoring
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class AssessmentScore:
    inherent_score: Optional[int]
    adjusted_score: Optional[int]
    uplift_total: int
    band: Optional[str]
    colour: Optional[str]
    review_frequency: Optional[str]
    approval_route: Optional[str]
    blocks_work: bool
    driving_category: Optional[str]


def _pair_score(likelihood: Optional[str], severity: Optional[str]) -> Optional[int]:
    lik = risk_scoring.LIKELIHOOD.get((likelihood or "").strip().lower())
    sev = risk_scoring.SEVERITY.get((severity or "").strip().lower())
    return (lik * sev) if lik and sev else None


def score_assessment(rows, *, uplifts: Dict[str, bool]) -> AssessmentScore:
    """The assessment's inherent score, from its worst category.

    An activity is as dangerous as its most dangerous part, so the highest
    category score drives the assessment rather than an average — averaging
    would let nine benign categories bury one that stops the job.
    """
    scored = []
    for r in rows:
        get = (lambda k: getattr(r, k, None)) if hasattr(r, "category_key") else r.get
        s = _pair_score(get("likelihood"), get("severity"))
        if s:
            scored.append((s, get("category_key")))

    if not scored:
        return AssessmentScore(None, None, 0, None, None, None, None, False, None)

    worst, driver = max(scored, key=lambda t: t[0])
    result = risk_scoring.score_risk(
        raw_score=worst,
        no_valid_rams=uplifts.get("no_valid_rams", False),
        new_worker=uplifts.get("new_worker", False),
        night_shift=uplifts.get("night_shift", False),
        temporary_control=uplifts.get("temporary_control", False),
    )
    return AssessmentScore(
        inherent_score=result.raw_score,
        adjusted_score=result.adjusted_score,
        uplift_total=result.uplift_total,
        band=result.band,
        colour=result.colour,
        review_frequency=result.review_frequency,
        approval_route=result.approval_route,
        blocks_work=result.blocks_work,
        driving_category=driver,
    )


def residual_for(rows) -> tuple[Optional[int], Optional[str], str, bool]:
    """The score once the controls are in, and what it takes to sign it off.

    Returns `(score, band, approval_route, blocks_work)`.

    This is the figure the spec hangs the decision on — "the residual score
    decides whether work can start" — and the routes are its own: 15 or above
    needs the Safety Manager, 20 or above the executive, and the permit stays
    blocked until that signature exists.
    """
    scored = [
        s for s in (
            _pair_score(
                getattr(r, "residual_likelihood", None) if hasattr(r, "category_key") else r.get("residual_likelihood"),
                getattr(r, "residual_severity", None) if hasattr(r, "category_key") else r.get("residual_severity"),
            )
            for r in rows
        ) if s
    ]
    if not scored:
        return None, None, ROUTE_SUPERVISOR, False

    worst = max(scored)
    band = risk_scoring.band_for(worst) if hasattr(risk_scoring, "band_for") else None
    if band is None:
        for floor, name, *_ in risk_scoring._BANDS:
            if worst >= floor:
                band = name
                break

    if worst >= 20:
        return worst, band, ROUTE_EXECUTIVE, True
    if worst >= risk_scoring.HIGH_THRESHOLD:
        return worst, band, ROUTE_SAFETY_MANAGER, True
    return worst, band, ROUTE_SUPERVISOR, False


def review_due(frequency: Optional[str], *, from_date: Optional[datetime] = None) -> Optional[datetime]:
    """When the assessment must be looked at again, from its band's cadence."""
    days = {"Monthly": 30, "Quarterly": 90, "6-monthly": 182, "Annual": 365}.get(frequency or "")
    if not days:
        return None
    return (from_date or datetime.now()) + timedelta(days=days)
