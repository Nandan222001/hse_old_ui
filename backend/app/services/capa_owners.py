"""Who a corrective action can be assigned to.

Extracted from `incident_workflow.capa_assignable_owners` so the report families
can offer the same list. It was a route handler, so the only way for
/near-miss-workflow to reach it was to copy the query — and a second copy of
"who may own a CAPA" would disagree with the first the day a role was added,
which is exactly how one family ends up able to assign to somebody another
family cannot.
"""
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


def assignable_owners(db: Session, org_id: Optional[int]) -> List[dict]:
    """Supervisors and safety managers in this organisation.

    Supervisors, not workers. A CAPA is a control change — refit a guard,
    rewrite a procedure, retrain a crew — and the accountable person is the
    supervisor who owns that area. `/assigned-tasks/assignable-workers`
    deliberately lists only `operator` logins and is the wrong list for this: it
    is for handing a worker a task, not for owning a corrective action.

    **Both** org columns must match, and that is not belt-and-braces. The login
    and the employee row disagree for some people in this database — employee
    103's login is org 4 while the employee row is org 1 — and the two workflow
    controllers now read different ones: this list used to filter on
    `users.organisation_id`, while the tenant check added to `supervisor_investigate`
    filters on `employees.organisation_id`. The result was a picker that offered
    a name and a write that answered "No such employee" when you chose it.

    Requiring both is the only answer that cannot desync: it is exactly the set
    the write will accept. Where a mismatch hides a genuinely assignable person,
    the fix is to repair the row — `backend/scripts/repair_employee_ref_org_mismatch.py`
    is there for that — not to widen the list past what the write allows.
    """
    rows = db.execute(
        text(
            "SELECT e.id, e.full_name, d.department_name AS department, ar.name AS role_name "
            "FROM users u "
            "JOIN employees e ON e.id = u.employee_id "
            "JOIN app_roles ar ON ar.id = u.app_role_id "
            "LEFT JOIN departments d ON e.department_id = d.id "
            "WHERE u.organisation_id = :org "
            "AND e.organisation_id = :org "
            "AND u.is_active = 1 "
            "AND (e.active_status IS NULL OR e.active_status = 'Active') "
            "AND LOWER(ar.name) IN ('supervisor', 'safety_manager') "
            "ORDER BY e.full_name"
        ),
        {"org": org_id},
    ).mappings().all()

    return [
        {
            "employee_id": r["id"],
            "name": r["full_name"],
            "department": r["department"] or "",
            "role": r["role_name"],
        }
        for r in rows
    ]
