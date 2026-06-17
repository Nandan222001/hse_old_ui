# -*- coding: utf-8 -*-
"""
Generates a reference PDF documenting every chart/KPI/percentage formula in
the HSE Intelligence app: what backend file computes it, what DB table/column
(and originating Excel sheet) it reads, the exact formula, and whether it's
real, a best-effort proxy, a known bug, or static dummy data.

Usage: python scripts/generate_formulas_pdf.py
"""
from fpdf import FPDF

OUT_PATH = r"C:\Users\ALOK\Desktop\HSE\hse_old_ui\HSE_Intelligence_Formulas_Reference.pdf"

# Each page section: (page_title, route, [ (metric_name, source, formula, notes, tag) ... ])
# tag in {"REAL", "PROXY", "BUG", "DUMMY"}
SECTIONS = [
("Dashboard (Home)", "/", [
    ("Predictive Injury Risk Score", "incidents.severity, incidents.incident_date_time",
     "weight: Critical/Significant=3, High/Major=2, Medium/Moderate=1, else=0.5\n"
     "score(period) = min(100, SUM(weight) / (count x 3) x 100)\n"
     "current  = score(today-90d -> today)\n"
     "previous = score(today-180d -> today-90d)\n"
     "Score = round(current); Trend = round(current - previous)",
     "backend/app/controllers/dashboard.py:get_leading_indicators(). Anchored to "
     "real today (2026); dataset activity ends 2025, so this currently reads 0%.", "BUG"),
    ("TRIR / LTIF", "incidents.incident_date_time, incidents.days_away, employees (count)",
     "hours_worked = total_employees x 2,000 (assumed annual hrs/employee)\n"
     "recordable = incidents in trailing 12 months\n"
     "lost_time  = incidents in trailing 12 months WHERE days_away > 0\n"
     "TRIR = recordable x 200,000 / hours_worked\n"
     "LTIF = lost_time  x 1,000,000 / hours_worked",
     "Same file. Real-time formula; not a certified OSHA-audited figure since "
     "actual hours-worked isn't tracked in this schema.", "PROXY"),
    ("Contractor Risk Score", "employees.employment_type, incidents.reported_by",
     "contractor_rate = contractor_incidents / contractor_employee_count\n"
     "permanent_rate  = permanent_incidents  / permanent_employee_count\n"
     "relative_risk = contractor_rate / permanent_rate\n"
     "Score = round(min(100, relative_risk x 50))\n"
     "Label: High >=1.5, Medium >=1, else Low",
     "Same file. employment_type matched case-insensitively on \"contract\".", "REAL"),
    ("Audit Readiness Score", "safety_walks.compliance_rating",
     "Score = round(avg(compliance_rating over trailing 90 days) / 5 x 100)\n"
     "Label: Ready >=80, Needs Attention >=60, else Not Ready",
     "Same file. Anchored to real today; reads 0%/Not Ready for the same reason "
     "as Predictive Injury Risk Score above.", "BUG"),
    ("Top Risk Chart (Data-Based)", "hazard_categories, hazards, incidents (joined via hazard_id)",
     "\"data\" series = count of incidents per hazard category (top 8)\n"
     "\"intelligence\" series = max(0, count - 5)",
     "backend/app/controllers/dashboard.py:get_incidents_by_category(). The "
     "\"intelligence\" series is an arbitrary offset, not a separate real metric.", "PROXY"),
    ("Exposure Index (gauge)", "safety_walks.compliance_rating (all-time avg)",
     "value = round(avg_compliance_rating x 20)",
     "backend/app/controllers/dashboard.py:get_dashboard_stats() -> avg_compliance_rating.", "REAL"),
    ("Competency Coverage (gauge)", "capa_actions (completed vs total)",
     "value = round(capa_completed / capa_total x 100)",
     "Same endpoint -> capa_completion_rate.", "REAL"),
    ("Ranked Action Table / Overdue CAPA", "capa_actions, employees",
     "Priority: High if overdue, Medium if due in <=7 days, else Low.\n"
     "Overdue list: status != Completed AND due_date < today.",
     "backend/app/controllers/dashboard.py:get_ranked_capa_actions() / get_overdue_capa().", "REAL"),
]),

("People (Users page, top section)", "/users", [
    ("Competency Coverage % (+ sparkline)", "incidents.root_cause / root_cause_category, "
     "capa_actions.root_cause_addressed, employees.induction_date",
     "flagged = employees whose incident root_cause/category OR CAPA root_cause_addressed "
     "contains \"train\"\n"
     "Coverage = (total_employees - len(flagged)) / total_employees x 100\n"
     "Sparkline: same formula recomputed at 10 monthly checkpoints as flags accrue "
     "by real incident date",
     "backend/app/controllers/people.py:get_people_overview(). induction_date is "
     "populated for all 150 employees post-Excel-seed.", "REAL"),
    ("Worker Exposure Index (gauge)", "incidents + near_misses, employees (count)",
     "Index = round(min(100, (recent_incidents + recent_near_misses) / total_employees x 100))\n"
     "\"recent\" = trailing 90 days, anchored to the LATEST real incident/near-miss "
     "date in the data (not today)\n"
     "Label: High Risk >30, Medium Risk >=10, else Low Risk",
     "Same file. Anchoring fixed to use real data's own latest date.", "REAL"),
    ("Supervisor Safety Score (ring)", "safety_walks.compliance_rating, roles.safety_signatory",
     "supervisors = employees whose role.safety_signatory = 'Yes'\n"
     "Score = round(avg(compliance_rating of walks performed by supervisors) / 5 x 100)",
     "Same file.", "REAL"),
    ("Fatigue Risk (overtime vs normal hours)", "shift_schedule.actual_hours_worked",
     "Per shift: normal = min(hours, 8); overtime = max(0, hours - 8)\n"
     "Summed org-wide per week, over the most recent 10 weeks of real shift data",
     "Same file. NOTE: every one of the 73,220 real shifts logs exactly 8.5 hours "
     "with zero variance, so this is mathematically flat (5,600 normal / 350 "
     "overtime every week) -- that's the real data, not a bug.", "REAL"),
    ("Safety Toolbox Meetings Trend", "safety_walks.inspection_date_time (ALL types)",
     "Monthly count of every safety_walks row, anchored to the latest real "
     "safety_walk date",
     "Same file. PROXY: no \"Toolbox\" inspection_type exists anywhere in the "
     "Excel/DB (only Compliance / Follow-up / Routine) -- this counts ALL "
     "inspections, not real toolbox talks.", "PROXY"),
    ("High Risk Roles", "incidents.reported_by + near_misses.reported_by, employees.role_id, roles",
     "rate = (incidents + near_misses attributed to a role) / headcount in that role\n"
     "Label: High if rate>=3, Medium if rate>=1.5, else Low. Top 4 shown.",
     "Same file.", "REAL"),
    ("Training Expiry Status", "employees.induction_date, training_programs.expiry_months",
     "For every (employee, training program) pair:\n"
     "  next_due = induction_date, advanced by expiry_months until >= today\n"
     "  bucket by days_until_due: Expired <0, Due<30 Days, Due<90 Days\n"
     "Expiring Soon badge = Expired_count + Due<30_count",
     "Same file. HEURISTIC: assumes every employee must renew every catalog "
     "training on its own cycle -- there is no real per-employee training "
     "assignment table in this schema.", "PROXY"),
    ("Behaviour Observations", "safety_walks.issues_found, near_misses (count)",
     "Safe = safety_walks with issues_found = 0\n"
     "At-Risk = safety_walks with issues_found > 0\n"
     "Near Miss = count(near_misses)\n"
     "Each shown as % of (Safe + At-Risk + Near Miss)",
     "Same file.", "REAL"),
    ("Coaching Actions / Open Actions", "capa_actions.action_type, status, due_date",
     "Coaching = open CAPA where action_type = 'Training'\n"
     "Open Actions = open CAPA where action_type != 'Training', ordered by due_date",
     "Same file. Coaching list is currently empty -- 0 of 42 real CAPA rows have "
     "action_type='Training' (all are 'Corrective').", "REAL"),
    ("Employee Directory table", "employees JOIN roles JOIN departments JOIN sites",
     "Plain listing, no calculation -- real name/role/department/site/status per employee.",
     "backend/app/controllers/people.py:get_employee_directory().", "REAL"),
]),

("Root Cause Analysis", "/root-cause-analysis", [
    ("Priority", "incidents.severity",
     "Significant / Critical / Fatal -> Critical\n"
     "Lost Time / High / Major -> High\n"
     "Serious / Medium / Moderate -> Medium\n"
     "else -> Low",
     "backend/app/controllers/analytics.py:_rca_priority(). Tuned to this "
     "dataset's real severity vocabulary (Lost Time/Minor/Serious/Significant).", "REAL"),
    ("Status", "incidents.investigation_status",
     "contains \"complete\" -> Closed; contains \"progress\" -> In Progress; else -> Pending",
     "analytics.py:_rca_status().", "REAL"),
    ("Completion Date", "capa_actions.due_date (for that incident's CAPA rows)",
     "If status=Closed: use MAX(due_date) of CAPA marked 'Completed';\n"
     "else fall back to MAX(due_date) of ANY CAPA tied to the incident;\n"
     "else leave blank (no real data to derive it from)",
     "analytics.py:get_root_cause_analysis(). 10 of 36 Closed incidents have no "
     "CAPA at all, so stay blank -- that's a real data gap, not a bug.", "REAL"),
    ("Corrective Actions / Preventive Measures", "capa_actions.description, action_type",
     "Preventive = CAPA descriptions where action_type contains \"prevent\"\n"
     "Corrective = all other CAPA descriptions for that incident, joined with \"; \"",
     "Same file. Preventive is always \"--\" -- 0 of 42 real CAPA rows have a "
     "\"preventive\"-type action_type (all are 'Corrective').", "REAL"),
    ("Site / Zone / Conducted By", "working_stations.zone_classification, sites.site_name, "
     "employees.full_name",
     "Site = site name via incident -> station -> site\n"
     "Zone = station's zone_classification\n"
     "Conducted By = the employee who reported the incident (closest real proxy; "
     "there's no dedicated \"investigator\" field)",
     "Same file.", "REAL"),
]),

("Actions / Work", "/actions", [
    ("Active Permits", "permits_to_work.status", "count WHERE status = 'Active'",
     "backend/app/controllers/analytics.py:get_permits_summary().", "REAL"),
    ("Work Exposure Hours", "permits_to_work.duration_requested_hours, number_of_workers",
     "SUM(duration_requested_hours x number_of_workers) WHERE status = 'Active'",
     "Same file.", "REAL"),
    ("Permit Compliance %", "permits_to_work.deviation_reported, incident_occurred",
     "compliant = permits WHERE deviation_reported != 'Yes' AND incident_occurred != 'Yes'\n"
     "Compliance % = compliant / total x 100",
     "Same file. Also reused identically on the Compliance page.", "REAL"),
    ("High Risk Work (radar)", "permit_types JOIN permits_to_work (status='Active')",
     "count of active permits per permit type, normalized:\n"
     "value = round(count / max(count across all types) x 100)",
     "Same file.", "REAL"),
    ("Work by Permit Type (stacked bar)", "permits_to_work.status, grouped by permit_type",
     "For each permit type: % of its permits that are Active / Closed / Expired "
     "(sums to ~100% per type)",
     "Same file. REPLACES a fake \"Work by Contractor\" chart -- no contractor "
     "entity exists anywhere in this schema.", "PROXY"),
    ("Missing Work Controls", "permits_to_work.deviation_reported='Yes', status='Active'",
     "Real active permits with a reported deviation, soonest-expiring first",
     "Same file. REPLACES 4 fully fake static strings.", "REAL"),
    ("Permit Violations", "incidents.permit_active='Yes' JOIN working_stations",
     "Recent incidents where a permit was marked active at the time", "Same file.", "REAL"),
    ("Active Work Table / Expiry Timeline", "permits_to_work (status='Active'), validity_end",
     "\"Expiry\" column shows the REAL validity_end date/time -- not a countdown.",
     "Same file. Checked: only 2 of 828 'Active' permits are genuinely within "
     "their own validity window at any single timestamp, so a \"time remaining\" "
     "countdown can't be made honest for this dataset.", "REAL"),
]),

("Compliance", "/compliance", [
    ("Compliance Score", "(composite of the 3 scores below)",
     "round(avg(Permit Compliance %, Legal Register Coverage %, Audit Readiness %))",
     "backend/app/controllers/analytics.py:get_compliance_summary().", "REAL"),
    ("Legal Register Coverage %", "policies.category (distinct), hazard_categories.category_name (distinct)",
     "min(100, round(distinct_policy_categories / distinct_hazard_categories x 100))",
     "Same file. Coverage-breadth proxy -- categories aren't named identically "
     "between the two registers (12 policy categories / 10 hazard categories).", "PROXY"),
    ("Audit Readiness Score", "safety_walks.compliance_rating (ALL-TIME avg)",
     "round(avg(compliance_rating) / 5 x 100)",
     "Same file. Deliberately all-time (not a trailing window) to avoid the "
     "today-anchored bug seen on the Dashboard page.", "REAL"),
    ("Compliance Trend (+ MoM badge)", "safety_walks.compliance_rating, grouped by month",
     "Monthly: round(avg(compliance_rating)/5 x 100), last 10 months of real "
     "data, anchored to the dataset's own latest safety_walk date\n"
     "MoM = latest_month_value - prior_month_value",
     "Same file.", "REAL"),
    ("Audit Findings by Severity", "safety_walks WHERE inspection_type='Compliance'",
     "Critical: critical_issues >= 2\nMajor: critical_issues == 1\n"
     "Minor: critical_issues == 0 AND issues_found >= 1\n"
     "Observation: critical_issues == 0 AND issues_found == 0",
     "Same file. \"Compliance\" is the closest real proxy to an \"audit\" "
     "inspection type in this dataset.", "PROXY"),
    ("Permit Compliance (gauge)", "permits_to_work", "Identical formula to the Actions page.",
     "Same file.", "REAL"),
    ("Policy Review Status (gauge)", "policies.status", "% of policies WHERE status = 'Current'",
     "Same file. Currently 100% -- all 12 real policies are marked Current.", "REAL"),
    ("Non-Conformance table", "capa_actions (open) + incidents.severity",
     "Open CAPA actions; criticality = the linked incident's Priority "
     "(Critical/High->High, Medium->Medium, Low->Low)",
     "Same file.", "REAL"),
]),

("Analytics & Reports", "/analytics", [
    ("Violation Type Breakdown (pie)", "incidents.root_cause_category",
     "count per category, top 5 (this dataset has exactly 5: Equipment, "
     "Management System, Procedure, Supervision, Training)",
     "backend/app/controllers/analytics.py:get_violations_summary().", "REAL"),
    ("Zone Risk Distribution (bar)", "incidents JOIN working_stations",
     "count of incidents per station, top 7 -- then on THIS page, normalized "
     "to 0-100% relative to the busiest station before applying red/amber/"
     "green color thresholds",
     "Backend returns raw counts (shared with Violations page); AnalyticsPage.tsx "
     "normalizes locally. Fixed: raw counts (max ~4) never crossed the 40/70 "
     "thresholds, so every bar used to render green regardless of real risk.", "REAL"),
    ("Monthly Violations vs Near Misses", "incidents.incident_date_time, near_misses.event_date_time",
     "count per month, grouped, last N months", "Same backend endpoint.", "REAL"),
    ("Severity Mix (Violations page)", "incidents.severity, grouped by month",
     "Same Critical/High/Medium/Low mapping as Root Cause Analysis Priority "
     "(fixed -- previously used a different, incorrect keyword mapping)",
     "analytics.py:get_violations_summary(), now reuses _rca_priority().", "REAL"),
    ("Downtime by Type", "incidents.days_away, summed per incident_type",
     "SUM(days_away) per type, the 5 LOWEST-downtime types are shown "
     "(ascending order)",
     "Same endpoint. Worth reviewing: typically you'd want the highest-downtime "
     "types surfaced, not the lowest.", "REAL"),
    ("PPE Compliance tab", "(none)",
     "Hard Hat 96%, Vest 92%, Shoes 89%, Gloves 85%, Goggles 78%",
     "FrontendNew/src/app/pages/AnalyticsPage.tsx. DUMMY DATA kept by explicit "
     "request (2026-06-17) -- no PPE-tracking table exists anywhere in the schema.", "DUMMY"),
    ("Scheduled Reports table", "(none)", "3 fake report rows with fake emails/dates",
     "Same file. DUMMY DATA kept by explicit request (2026-06-17) -- no "
     "report-scheduling/email table exists in the schema.", "DUMMY"),
    ("Sites checklist (Custom Reports tab)", "sites.site_name",
     "Real site names from GET /sites/", "Same file. NOTE: source Excel genuinely "
     "has all 8 Site rows duplicated as \"Bridgend Manufacturing Complex\" -- "
     "that's a real characteristic of the source data, not a bug.", "REAL"),
]),

("Risk Management", "/risk", [
    ("Control Effectiveness Score", "capa_actions", "round(completed / total x 100)",
     "backend/app/controllers/analytics.py:get_risk_summary().", "REAL"),
    ("Unverified Controls", "capa_actions.status != 'Completed'", "count", "Same file.", "REAL"),
    ("Risk Escalations", "capa_actions.status != 'Completed' AND due_date < today", "count",
     "Same file.", "REAL"),
    ("Risk by Zone/Site/Team (bar)", "incidents JOIN working_stations JOIN sites",
     "count of incidents per site, top 5", "Same file.", "REAL"),
    ("Action/High Risk Active Tasks table", "capa_actions (open), employees",
     "Status label: Overdue (Red) if due_date<today; In Progress (Amber) if "
     "due in <=3 days; else Pending (Yellow)", "Same file.", "REAL"),
    ("Risk Aging (stacked bars + line)", "capa_actions (open)",
     "Bucket by days overdue: 0-30 / 31-60 / 61-90 / >90 Days\n"
     "Sub-severity within bucket by days_over: >60->critical, >30->high, "
     ">0->medium, else low (no due_date -> medium)",
     "Same file.", "REAL"),
    ("Residual Risk Trend (area chart)", "(none)", "Q1 90, Q2 64, Q3 48, Q4 34",
     "FrontendNew/src/app/pages/RiskPage.tsx. Fully static -- no quarterly risk "
     "model exists in the backend.", "DUMMY"),
    ("Risk Matrix (5x5 heatmap)", "(none)", "Static likelihood x impact scores/labels",
     "Same file. Fully static reference matrix, not backend-driven.", "DUMMY"),
]),

("Violations", "/violations", [
    ("Incident Types / Incident Location", "incidents.incident_type, working_stations.station_name",
     "Same by_type / by_location formulas as the Analytics page (shared endpoint)",
     "backend/app/controllers/analytics.py:get_violations_summary().", "REAL"),
    ("Injury Category / Person Involved / Type of Injury", "(none)",
     "e.g. Hand/Finger 5, Multiple 3... / Green Hand(s) 6... / Cut Wound 3...",
     "FrontendNew/src/app/pages/ViolationsPage.tsx. Fully static -- no "
     "injury-body-part or person-type tracking exists in this schema.", "DUMMY"),
    ("Incident Cause Category (pie)", "incidents.root_cause_category",
     "Top 3 categories by count (cause_data)", "Shared endpoint.", "REAL"),
    ("Incident Trend / Near Miss Trend / Downtime / Severity Mix / RCA Breakdown",
     "incidents, near_misses (shared with Analytics/Dashboard)",
     "Same formulas documented under Analytics & Reports above.",
     "Shared endpoint.", "REAL"),
    ("Key Learnings", "(none)", "4 static placeholder strings",
     "Same file. Fully static, and the placeholder text itself appears to be "
     "garbled filler, not even meaningful dummy content.", "DUMMY"),
    ("Open Actions checklist", "capa_actions (open)",
     "Same open_capa_items list as Dashboard/Analytics", "Shared endpoint.", "REAL"),
]),

("Assets", "/equipment (or similar)", [
    ("Asset Control Effectiveness, Safety Maintenance Status, Critical Asset "
     "Failure Trends, Asset Heat Map, Asset Incident Trend, Asset Risk Table, "
     "Overdue Inspections, Critical Barrier Checklist", "(none)",
     "All hardcoded numbers/labels.",
     "FrontendNew/src/app/pages/AssetsPage.tsx. ENTIRE PAGE is fully static -- "
     "there is no equipment/asset table anywhere in this schema.", "DUMMY"),
]),
]

TAG_COLOR = {
    "REAL":  (39, 116, 53),
    "PROXY": (179, 109, 0),
    "BUG":   (178, 34, 34),
    "DUMMY": (110, 110, 110),
}
TAG_LABEL = {
    "REAL": "REAL - live DB calculation",
    "PROXY": "BEST-EFFORT PROXY - real data, approximated concept",
    "BUG": "KNOWN BUG - today-anchored date window reads 0 on this dataset",
    "DUMMY": "STATIC DUMMY - no backing table exists",
}


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 8, "HSE Intelligence - Formulas & Data Source Reference", align="L")
        self.cell(0, 8, f"Page {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def footer(self):
        pass


def full_width_multicell(pdf: PDF, h, text, align="L", fill=False):
    """multi_cell across the full content width, with x explicitly reset
    first -- works around an fpdf2 cursor-drift issue after align='C' calls."""
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(pdf.epw, h, text, align=align, fill=fill, new_x="LMARGIN", new_y="NEXT")


def add_title_page(pdf: PDF):
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 24)
    pdf.ln(40)
    full_width_multicell(pdf, 12, "HSE Intelligence Platform", align="C")
    pdf.set_font("Helvetica", "", 16)
    full_width_multicell(pdf, 10, "Formulas & Data Source Reference", align="C")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(90, 90, 90)
    full_width_multicell(pdf, 7,
        "Every chart, KPI, gauge and percentage across the application: the exact "
        "calculation, which database table/column it reads (and the originating "
        "HSE_Intelligence_Test_Data.xlsx sheet where applicable), and whether it is "
        "a real live calculation, a documented best-effort proxy, a known bug, or "
        "static placeholder data.", align="C")
    pdf.ln(14)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 8, "Legend:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    for tag, label in TAG_LABEL.items():
        r, g, b = TAG_COLOR[tag]
        pdf.set_x(pdf.l_margin)
        pdf.set_text_color(r, g, b)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(28, 7, tag)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(pdf.epw - 28, 7, label, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)


def add_toc(pdf: PDF):
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 10, "Contents", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 11)
    for i, (title, route, _items) in enumerate(SECTIONS, start=1):
        pdf.set_x(pdf.l_margin)
        pdf.cell(10, 8, f"{i}.")
        pdf.multi_cell(pdf.epw - 10, 8, f"{title}  ({route})", new_x="LMARGIN", new_y="NEXT")


def sanitize(text: str) -> str:
    # FPDF core fonts are latin-1 only; swap the few special chars we use.
    return (text.replace("—", "-").replace("’", "'").replace("→", "->")
                .replace("≥", ">=").replace("≤", "<=").replace("✓", "OK"))


def add_section(pdf: PDF, title: str, route: str, items):
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_fill_color(235, 240, 235)
    full_width_multicell(pdf, 12, sanitize(title), fill=True)
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(90, 90, 90)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 7, f"Route: {route}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(3)

    for name, source, formula, notes, tag in items:
        if pdf.get_y() > 250:
            pdf.add_page()
        pdf.set_font("Helvetica", "B", 12)
        full_width_multicell(pdf, 7, sanitize(name))

        r, g, b = TAG_COLOR[tag]
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(r, g, b)
        pdf.set_x(pdf.l_margin)
        pdf.cell(0, 5, f"[{tag}]", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)

        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_x(pdf.l_margin)
        pdf.cell(22, 6, "Source:")
        pdf.set_font("Helvetica", "", 9.5)
        pdf.multi_cell(pdf.epw - 22, 6, sanitize(source), new_x="LMARGIN", new_y="NEXT")

        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_x(pdf.l_margin)
        pdf.cell(22, 6, "Formula:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Courier", "", 9)
        pdf.set_fill_color(247, 247, 247)
        full_width_multicell(pdf, 5.2, sanitize(formula), fill=True)

        if notes:
            pdf.set_font("Helvetica", "BI", 9)
            pdf.set_x(pdf.l_margin)
            pdf.cell(22, 6, "Notes:")
            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(70, 70, 70)
            pdf.multi_cell(pdf.epw - 22, 5.5, sanitize(notes), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(0, 0, 0)

        pdf.ln(4)
        pdf.set_draw_color(220, 220, 220)
        pdf.set_x(pdf.l_margin)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(4)


def main():
    pdf = PDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(18, 15, 18)

    add_title_page(pdf)
    add_toc(pdf)
    for title, route, items in SECTIONS:
        add_section(pdf, title, route, items)

    pdf.output(OUT_PATH)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
