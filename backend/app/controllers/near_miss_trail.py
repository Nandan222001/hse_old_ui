"""Near miss lifecycle tracking for the admin console.

`/near-miss-workflow` answers "what can I do next" for the role doing the work.
This answers "what was done, by whom, when" for the person accountable for the
whole lifecycle — the same split `/incident-workflow` and `/incident-trail` have.
Nothing here writes.

The router is built by `report_trail_factory`, which near misses, unsafe acts
and risk reports can all share: they carry the same `ReportWorkflowMixin`
columns, so the trail is reconstructed identically for each.
"""
from app.controllers.report_trail_factory import build_trail_router

router = build_trail_router(
    report_type="near_miss",
    table="near_misses",
    prefix="/near-miss-trail",
    tag="Near Miss Trail",
    noun="near miss",
    # Matches the mobile queue and the closure event, so one record is named
    # identically wherever the admin meets it.
    ref_prefix="NEA",
)
