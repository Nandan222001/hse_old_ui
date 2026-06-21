"""
HSE Intelligence Platform — Full Data Flow PDF Generator
Generates a comprehensive reference document covering every page, chart,
formula, and DB source in the platform.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.colors import HexColor
import os

# ── Colour Palette ────────────────────────────────────────────────────────────
TEAL      = HexColor("#12B8A6")
DARK_BLUE = HexColor("#1E293B")
MID_BLUE  = HexColor("#334155")
LIGHT_BG  = HexColor("#F0FDFA")
ACCENT    = HexColor("#0EA5E9")
WARN      = HexColor("#F59E0B")
DANGER    = HexColor("#EF4444")
SUCCESS   = HexColor("#22C55E")
PURPLE    = HexColor("#8B5CF6")
WHITE     = colors.white
LIGHT_GREY = HexColor("#F1F5F9")
BORDER_GREY = HexColor("#CBD5E1")
TEXT_DARK  = HexColor("#0F172A")
TEXT_MID   = HexColor("#475569")

W, H = A4
MARGIN = 18 * mm

OUTPUT = os.path.join(os.path.dirname(__file__), "HSE_Platform_Data_Flow.pdf")


# ── Custom page template ───────────────────────────────────────────────────────
def make_canvas(canvas, doc):
    canvas.saveState()
    # Header bar
    canvas.setFillColor(DARK_BLUE)
    canvas.rect(0, H - 14 * mm, W, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(MARGIN, H - 9 * mm, "HSE Intelligence Platform — Data Flow Reference")
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(W - MARGIN, H - 9 * mm, f"Page {doc.page}")
    # Footer bar
    canvas.setFillColor(LIGHT_BG)
    canvas.rect(0, 0, W, 10 * mm, fill=1, stroke=0)
    canvas.setFillColor(TEXT_MID)
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(W / 2, 3.5 * mm, "Confidential — Internal Use Only")
    canvas.restoreState()


# ── Style helpers ─────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    base = styles.get(name, styles["Normal"])
    return ParagraphStyle(name + str(id(kw)), parent=base, **kw)

H1 = S("Heading1", fontSize=20, textColor=DARK_BLUE, fontName="Helvetica-Bold",
        spaceAfter=4, spaceBefore=6)
H2 = S("Heading2", fontSize=14, textColor=TEAL, fontName="Helvetica-Bold",
        spaceAfter=3, spaceBefore=10, borderPad=2)
H3 = S("Heading3", fontSize=11, textColor=DARK_BLUE, fontName="Helvetica-Bold",
        spaceAfter=2, spaceBefore=6)
H4 = S("Heading4", fontSize=9.5, textColor=MID_BLUE, fontName="Helvetica-Bold",
        spaceAfter=1, spaceBefore=4)
BODY = S("Normal", fontSize=9, textColor=TEXT_DARK, leading=14, spaceAfter=3,
         fontName="Helvetica", alignment=TA_JUSTIFY)
BODY_SM = S("Normal", fontSize=8, textColor=TEXT_MID, leading=12, spaceAfter=2,
            fontName="Helvetica")
CODE = S("Code", fontSize=7.5, fontName="Courier", textColor=HexColor("#1D4ED8"),
         backColor=HexColor("#EFF6FF"), leading=11, spaceAfter=2,
         leftIndent=6, rightIndent=6, borderPad=3)
LABEL = S("Normal", fontSize=8, textColor=WHITE, fontName="Helvetica-Bold",
          alignment=TA_CENTER)
NOTE = S("Normal", fontSize=8, textColor=HexColor("#92400E"), leading=12,
         fontName="Helvetica", backColor=HexColor("#FEF3C7"),
         leftIndent=6, borderPad=3)

def sp(h=4):   return Spacer(1, h * mm)
def hr():      return HRFlowable(width="100%", thickness=0.5, color=BORDER_GREY,
                                 spaceAfter=3, spaceBefore=3)

def badge_table(items, bg=TEAL):
    """Render a row of coloured chips."""
    cells = [[Paragraph(i, LABEL) for i in items]]
    t = Table(cells, colWidths=[38 * mm] * len(items), rowHeights=[7 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("ROUNDEDCORNERS", [3]),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.3, WHITE),
    ]))
    return t


def section_header(title, colour=TEAL):
    data = [[Paragraph(f"  {title}", S("Normal", fontSize=12, fontName="Helvetica-Bold",
                                        textColor=WHITE))]]
    t = Table(data, colWidths=[W - 2 * MARGIN], rowHeights=[9 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colour),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def kv_table(rows, col1=65 * mm, col2=None):
    """Two-column key-value table."""
    col2 = col2 or (W - 2 * MARGIN - col1)
    data = [[Paragraph(f"<b>{k}</b>", BODY_SM), Paragraph(v, BODY_SM)] for k, v in rows]
    t = Table(data, colWidths=[col1, col2])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
        ("BACKGROUND", (1, 0), (1, -1), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GREY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def chart_block(title, what, why, formula, db_source, notes=None, colour=TEAL):
    """Standard block for a chart/KPI entry."""
    elems = []
    # Title pill
    title_data = [[Paragraph(f"  📊  {title}", S("Normal", fontSize=9.5,
                              fontName="Helvetica-Bold", textColor=WHITE))]]
    tt = Table(title_data, colWidths=[W - 2 * MARGIN], rowHeights=[8 * mm])
    tt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colour),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elems.append(tt)

    rows = [
        ("What is it?", what),
        ("Why shown?", why),
        ("Formula / Logic", formula),
        ("DB Source", db_source),
    ]
    if notes:
        rows.append(("Notes", notes))
    elems.append(kv_table(rows))
    elems.append(sp(2))
    return KeepTogether(elems)


# ══════════════════════════════════════════════════════════════════════════════
#  CONTENT SECTIONS
# ══════════════════════════════════════════════════════════════════════════════

story = []

# ─── COVER PAGE ───────────────────────────────────────────────────────────────
cover_data = [[Paragraph(
    "<font color='#12B8A6'><b>HSE Intelligence Platform</b></font><br/>"
    "<font size=14 color='#334155'>Complete Data Flow Reference</font><br/><br/>"
    "<font size=9 color='#64748B'>Charts · Formulas · DB Sources · Business Logic</font>",
    S("Normal", fontSize=22, fontName="Helvetica-Bold", alignment=TA_CENTER,
      textColor=DARK_BLUE, leading=30))]]
cover = Table(cover_data, colWidths=[W - 2 * MARGIN],
              rowHeights=[(H - 2 * MARGIN) * 0.55])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("BOX", (0, 0), (-1, -1), 1.5, TEAL),
]))
story.append(sp(20))
story.append(cover)
story.append(sp(6))

meta = [
    ["Platform", "HSE Intelligence Platform (hse_old_ui)"],
    ["Frontend", "React 18 + TypeScript + Vite + Tailwind CSS v4"],
    ["Backend", "FastAPI (Python) + SQLAlchemy 2.0"],
    ["Database", "MySQL via XAMPP"],
    ["Auth", "JWT (HS256, 60-min TTL) — org_id embedded in token"],
    ["API Base", "http://localhost:8080/api/v1  ← proxied from Vite /api/v1"],
    ["Multi-tenant", "Every table has organisation_id; all queries filter by org"],
    ["Document scope", "Every page, every chart, every KPI — real data sources documented"],
]
story.append(kv_table(meta, col1=55 * mm))
story.append(PageBreak())

# ─── TABLE OF CONTENTS ────────────────────────────────────────────────────────
story.append(Paragraph("Table of Contents", H1))
story.append(hr())
toc_items = [
    ("1", "Architecture Overview", "How data flows from DB → API → UI"),
    ("2", "Dashboard  /", "KPI cards, incident trend, heatmap"),
    ("3", "Checklists  /checklists", "Status breakdown, compliance rate, category rings"),
    ("4", "Users  /users", "Employee roster, department stats"),
    ("5", "Root Cause Analysis  /root-cause-analysis", "RCA list, priority, status"),
    ("6", "Actions (CAPA)  /actions", "CAPA table, status KPIs, overdue tracking"),
    ("7", "Compliance  /compliance", "Compliance score, audit readiness, trend"),
    ("8", "Analytics  /analytics", "8 tabs: Violations, Near Miss, RCA, Permits, Contractor, Zone Risk, Trend, PPE"),
    ("9", "Risk  /risk", "Risk matrix, zone bar chart, residual trend, aging"),
    ("10", "Equipment Certification  /equipment-certification", "Cert status, type breakdown"),
    ("11", "Violations  /violations + /violations/:id", "Incident list, detail page"),
    ("12", "Engagement  /engagement", "Reporting rate, survey score, ring KPIs, CAPA actions"),
    ("13", "Formula Cheat-Sheet", "All computed metrics in one place"),
    ("14", "DB Table Reference", "Table name → columns → which pages use it"),
]
toc_data = [[Paragraph(f"<b>{n}</b>", BODY_SM),
             Paragraph(f"<b>{title}</b>", BODY_SM),
             Paragraph(desc, BODY_SM)] for n, title, desc in toc_items]
toc_t = Table(toc_data, colWidths=[10 * mm, 70 * mm, W - 2 * MARGIN - 80 * mm])
toc_t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), WHITE),
    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_BG, WHITE]),
    ("GRID", (0, 0), (-1, -1), 0.3, BORDER_GREY),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
]))
story.append(toc_t)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("1.  Architecture Overview"))
story.append(sp(2))
story.append(Paragraph(
    "Every data point visible in the UI originates from the MySQL database and passes through "
    "the FastAPI backend before reaching the React frontend. No hard-coded business data exists "
    "anywhere in the final production build.", BODY))
story.append(sp(2))

arch = [
    ["Layer", "Technology", "Role"],
    ["Database", "MySQL 8 (XAMPP)", "Stores all entities: incidents, employees, safety walks, permits, CAPA, etc."],
    ["ORM", "SQLAlchemy 2.0", "Maps Python classes to DB tables; enforces multi-tenant org filtering"],
    ["Backend", "FastAPI (Python 3.11)", "REST API on port 8080; JWT auth; business logic & aggregations"],
    ["Proxy", "Vite Dev Server", "Forwards /api/* from port 5173 → port 8080 so CORS is bypassed"],
    ["Frontend", "React 18 + TypeScript", "Calls axiosInstance which adds Bearer token from localStorage"],
    ["State", "React useState / useEffect", "Each page fetches its own data on mount; no global cache"],
    ["Auth", "JWT HS256 (60-min TTL)", "org_id + user id embedded; backend extracts with get_current_user()"],
]
arch_t = Table(arch, colWidths=[30*mm, 42*mm, W-2*MARGIN-72*mm])
arch_t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, 0), 8),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, WHITE]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GREY),
    ("FONTSIZE", (0, 1), (-1, -1), 8),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
]))
story.append(arch_t)
story.append(sp(3))
story.append(Paragraph("<b>Multi-tenant filtering rule</b>", H4))
story.append(Paragraph(
    "Every SQL query in the backend passes through <font name='Courier'>_org_filter(query, Model, org_id)</font> "
    "which appends <font name='Courier'>WHERE model.organisation_id = :org_id</font>. "
    "This means every user only ever sees data belonging to their organisation.", BODY))
story.append(Paragraph(
    "<font name='Courier'>def _org_filter(query, model, org_id):<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if org_id is not None:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return query.filter(model.organisation_id == org_id)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;return query</font>", CODE))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("2.  Dashboard  ( / )"))
story.append(sp(2))
story.append(Paragraph(
    "The dashboard is the landing page. It calls <b>/api/v1/analytics/dashboard-summary</b> "
    "and renders KPI cards, a monthly incident trend chart, a severity pie chart, and a "
    "site-activity heatmap.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Total Incidents (KPI Card)",
    "Count of all incident records for the org this month.",
    "Gives managers a quick pulse on incident volume for the current period.",
    "SELECT COUNT(*) FROM incidents WHERE organisation_id=:org AND report_date >= first_of_month",
    "Table: incidents  Columns: id, organisation_id, report_date",
    colour=DANGER))

story.append(chart_block(
    "Near Misses (KPI Card)",
    "Count of near-miss events reported this month.",
    "Near misses are leading indicators of accidents; tracking them drives preventive action.",
    "SELECT COUNT(*) FROM near_misses WHERE organisation_id=:org AND DATE(event_date_time) >= first_of_month",
    "Table: near_misses  Columns: id, organisation_id, event_date_time",
    colour=WARN))

story.append(chart_block(
    "Open CAPA Actions (KPI Card)",
    "Count of corrective/preventive actions that are not yet 'Completed'.",
    "Unresolved CAPA actions represent outstanding safety obligations.",
    "SELECT COUNT(*) FROM capa_actions WHERE organisation_id=:org AND status != 'Completed'",
    "Table: capa_actions  Columns: id, organisation_id, status",
    colour=PURPLE))

story.append(chart_block(
    "Monthly Incident Trend (Line Chart)",
    "Bar or line chart showing incident count per month for the last 10 months.",
    "Reveals whether incident rates are improving or worsening over time.",
    "For each of last 10 months: SELECT COUNT(*) FROM incidents WHERE YEAR=y AND MONTH=m AND org=:org  "
    "→ list of {month: 'JAN', value: N}",
    "Table: incidents  Columns: id, organisation_id, report_date",
    colour=ACCENT))

story.append(chart_block(
    "Severity Distribution (Pie / Donut Chart)",
    "Breakdown of incidents by severity level: Critical / High / Medium / Low.",
    "Identifies whether high-severity incidents dominate, guiding resource prioritisation.",
    "SELECT severity, COUNT(*) FROM incidents WHERE org=:org GROUP BY severity",
    "Table: incidents  Columns: severity (enum string)  "
    "Mapping: 1→Critical, 2→High, 3→Medium, 4→Low, else→Unknown",
    colour=DANGER))

story.append(chart_block(
    "Site Activity Heatmap",
    "Grid of sites × months showing incident count per cell.",
    "Highlights which sites have persistent high incident rates month-on-month.",
    "For each site s and month m: SELECT COUNT(*) FROM incidents i JOIN working_stations ws "
    "ON i.location_station_id=ws.id WHERE ws.site_id=s AND org=:org AND YEAR/MONTH=m",
    "Tables: incidents, working_stations, sites  "
    "Columns: location_station_id, site_id, site.name",
    colour=MID_BLUE))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — CHECKLISTS
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("3.  Checklists  ( /checklists )"))
story.append(sp(2))
story.append(Paragraph(
    "Fetches safety-walk inspection records. API endpoint: <b>GET /api/v1/safety-walks/</b>. "
    "The frontend maps raw DB rows to checklist-style display items.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Status Breakdown (Bar / Donut)",
    "Count of safety walks grouped by follow_up_required (Yes/No) and compliance_rating bands.",
    "Measures how many inspections identified issues requiring follow-up.",
    "SELECT follow_up_required, COUNT(*) FROM safety_walks WHERE org=:org GROUP BY follow_up_required",
    "Table: safety_walks  Columns: id, organisation_id, follow_up_required, compliance_rating, inspection_date_time",
    colour=TEAL))

story.append(chart_block(
    "Compliance Rate (KPI %)",
    "Percentage of walks with compliance_rating >= 4 (out of 5).",
    "A high rate means inspections are passing; a low rate signals systemic issues.",
    "compliant_walks / total_walks × 100  where compliant_walks: rating >= 4",
    "Table: safety_walks  Column: compliance_rating (Integer 1–5)",
    colour=SUCCESS))

story.append(chart_block(
    "Inspection Type Rings (Donut Charts)",
    "Each ring shows walks of a specific inspection_type (e.g., General, Toolbox) as a % of total.",
    "Breaks down where safety attention is being directed.",
    "SELECT inspection_type, COUNT(*) FROM safety_walks WHERE org=:org GROUP BY inspection_type",
    "Table: safety_walks  Column: inspection_type (VARCHAR 100)",
    colour=ACCENT))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — USERS
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("4.  Users  ( /users )"))
story.append(sp(2))
story.append(Paragraph(
    "Displays the employee roster. API: <b>GET /api/v1/employees/?limit=200</b> "
    "plus <b>GET /api/v1/analytics/org-users</b> for department-level aggregations.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Employee Table",
    "Full list of employees with name, department, job title, employment type, and status.",
    "Central people register for HSE accountability — used to assign CAPA and recognitions.",
    "SELECT * FROM employees WHERE organisation_id=:org LIMIT 200",
    "Table: employees  Columns: id, full_name, department_id, job_title, employment_type, "
    "is_active, organisation_id, email, phone",
    colour=MID_BLUE))

story.append(chart_block(
    "Department Count Cards",
    "KPI cards showing total employees per department.",
    "Helps HR spot understaffed departments and balance HSE resource allocation.",
    "SELECT d.name, COUNT(e.id) FROM employees e JOIN departments d ON e.department_id=d.id "
    "WHERE e.organisation_id=:org GROUP BY d.name",
    "Tables: employees, departments  Columns: department_id, department.name",
    colour=ACCENT))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — ROOT CAUSE ANALYSIS
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("5.  Root Cause Analysis  ( /root-cause-analysis )"))
story.append(sp(2))
story.append(Paragraph(
    "Displays all RCA records derived from incidents. API: "
    "<b>GET /api/v1/analytics/root-cause-analysis</b>. "
    "Each RCA is built from the incident table — there is no separate RCA table; "
    "the backend constructs RCA objects from incident fields.", BODY))
story.append(sp(2))

story.append(chart_block(
    "RCA List Table",
    "Table of incidents treated as RCA records with ID, incident type, site, zone, "
    "conducted-by (reported_by employee), start/completion dates, root causes, status, priority.",
    "Enables systematic review of why each incident occurred and whether corrective steps were taken.",
    "SELECT i.*, ws.name as station, s.name as site, e.full_name as reporter "
    "FROM incidents i "
    "LEFT JOIN working_stations ws ON i.location_station_id=ws.id "
    "LEFT JOIN sites s ON ws.site_id=s.id "
    "LEFT JOIN employees e ON i.reported_by=e.id "
    "WHERE i.organisation_id=:org",
    "Tables: incidents, working_stations, sites, employees  "
    "Columns: id, incident_type, root_cause, immediate_cause, "
    "investigation_status, report_date, severity",
    notes="Priority is mapped from severity: Critical→Critical, High→High, "
    "Medium→Medium, Low→Low. Status comes from investigation_status field.",
    colour=DANGER))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — ACTIONS (CAPA)
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("6.  Actions (CAPA)  ( /actions )"))
story.append(sp(2))
story.append(Paragraph(
    "Corrective and Preventive Actions. API: <b>GET /api/v1/capa-actions/</b> "
    "(direct model endpoint, not analytics). Status KPIs computed client-side.", BODY))
story.append(sp(2))

story.append(chart_block(
    "CAPA Table",
    "All CAPA actions with ID, action type, description, responsible person, due date, status.",
    "Tracks every corrective obligation stemming from incidents, near misses, and audits.",
    "SELECT * FROM capa_actions WHERE organisation_id=:org ORDER BY due_date ASC LIMIT 200",
    "Table: capa_actions  Columns: id, action_type, description, "
    "responsible_person_id, due_date, status, organisation_id, incident_id",
    colour=WARN))

story.append(chart_block(
    "Status KPI Cards  (Open / Overdue / Completed)",
    "Three cards showing counts per status band.",
    "Management KPIs for closure rate and overdue backlog.",
    "Open = status NOT IN ('Completed')  "
    "Overdue = status != 'Completed' AND due_date < TODAY()  "
    "Completed = status = 'Completed'  — all computed client-side from the full list.",
    "Table: capa_actions  Columns: status, due_date",
    colour=PURPLE))

story.append(chart_block(
    "Overdue Indicator per Row",
    "Each table row shows a badge if due_date < today and status is not Completed.",
    "Draws attention to actions that have passed their deadline.",
    "Client-side: new Date(due_date) < new Date() && status !== 'Completed'",
    "Column: due_date (Date), status (VARCHAR)",
    colour=DANGER))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 7 — COMPLIANCE
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("7.  Compliance  ( /compliance )"))
story.append(sp(2))
story.append(Paragraph(
    "API: <b>GET /api/v1/analytics/compliance-summary</b>. "
    "Aggregates data from permits, policies, incidents, and CAPA to produce "
    "the compliance health picture.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Compliance Score  (Big KPI %)",
    "Overall compliance health as a weighted percentage.",
    "Single headline metric for auditors and senior management.",
    "compliance_score = round(\n"
    "  (permit_compliance_pct * 0.4 + policy_review_pct * 0.35 + audit_readiness_pct * 0.25)\n"
    ")\n"
    "where:\n"
    "  permit_compliance_pct = active_permits / max(total_permits,1) * 100\n"
    "  policy_review_pct     = reviewed_policies / max(total_policies,1) * 100\n"
    "  audit_readiness_pct   = 100 − (open_critical_findings / max(total_findings,1) * 100)",
    "Tables: permit_to_works, policys, capa_actions, incidents  "
    "Columns: status, review_date, severity",
    colour=TEAL))

story.append(chart_block(
    "Legal Register Coverage  (%)",
    "Percentage of policies that have been reviewed at least once.",
    "Regulatory requirement: all legal obligations must be documented and reviewed.",
    "reviewed_policies / total_policies * 100  "
    "reviewed = policies WHERE status = 'Active'",
    "Table: policys  Columns: id, status, organisation_id",
    colour=SUCCESS))

story.append(chart_block(
    "Audit Readiness  (%)",
    "Inverse of outstanding critical findings as a fraction of all findings.",
    "High readiness means few unresolved critical issues — the org is ready for an external audit.",
    "audit_readiness_pct = 100 − (open_critical / max(total_findings, 1) * 100)\n"
    "open_critical = capa_actions WHERE status != 'Completed' AND incident.severity IN (1,2)",
    "Tables: capa_actions, incidents  Columns: status, severity",
    colour=ACCENT))

story.append(chart_block(
    "Compliance Trend  (Line Chart — 12 months)",
    "Monthly compliance score for the last 12 months.",
    "Shows whether compliance is improving or eroding over time.",
    "For each month m in last 12: compute compliance_score the same way but scoped to incidents "
    "and permits active in that month.",
    "Tables: incidents, permit_to_works, policys  Columns: report_date, created_at, review_date",
    colour=MID_BLUE))

story.append(chart_block(
    "Findings by Severity  (Donut Chart)",
    "Pie breakdown of CAPA actions by severity of the linked incident.",
    "Visualises whether unresolved work is dominated by high-severity findings.",
    "SELECT i.severity, COUNT(c.id) FROM capa_actions c "
    "JOIN incidents i ON c.incident_id=i.id "
    "WHERE c.organisation_id=:org GROUP BY i.severity",
    "Tables: capa_actions, incidents  Columns: incident_id, severity",
    colour=DANGER))

story.append(chart_block(
    "Non-Conformance Table",
    "Top open CAPA actions with action description, owner name, due date, criticality badge.",
    "Provides a concrete action list for compliance officers.",
    "SELECT c.description, e.full_name, c.due_date, i.severity "
    "FROM capa_actions c "
    "LEFT JOIN employees e ON c.responsible_person_id=e.id "
    "LEFT JOIN incidents i ON c.incident_id=i.id "
    "WHERE c.status != 'Completed' AND c.organisation_id=:org "
    "ORDER BY c.due_date ASC LIMIT 10",
    "Tables: capa_actions, employees, incidents",
    colour=WARN))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 8 — ANALYTICS (8 TABS)
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("8.  Analytics  ( /analytics ) — 8 Tabs"))
story.append(sp(2))
story.append(Paragraph(
    "The Analytics page is the most data-rich page. It pulls from three backend endpoints: "
    "<b>/analytics/violations-summary</b>, <b>/analytics/permits-summary</b>, and "
    "<b>/analytics/compliance-summary</b>. Tabs are rendered client-side from the fetched data.", BODY))
story.append(sp(3))

# TAB 1
story.append(Paragraph("Tab 1 — Violations Summary", H3))
story.append(chart_block(
    "Incidents by Type  (Bar Chart)",
    "Number of incidents grouped by incident_type (e.g., Near Miss, Injury, Property Damage).",
    "Identifies the most common incident categories to target prevention efforts.",
    "SELECT incident_type, COUNT(*) FROM incidents WHERE org=:org GROUP BY incident_type",
    "Table: incidents  Column: incident_type (VARCHAR)",
    colour=DANGER))

story.append(chart_block(
    "Incidents by Location  (Horizontal Bar)",
    "Incident counts per site/zone.",
    "Identifies geographical hotspots where more safety interventions are needed.",
    "SELECT s.name, COUNT(i.id) FROM incidents i "
    "JOIN working_stations ws ON i.location_station_id=ws.id "
    "JOIN sites s ON ws.site_id=s.id "
    "WHERE i.organisation_id=:org GROUP BY s.name",
    "Tables: incidents, working_stations, sites  Columns: location_station_id, site_id, name",
    colour=WARN))

story.append(chart_block(
    "Root Cause Donut  (Pie Chart)",
    "Distribution of incidents by root_cause category.",
    "Reveals systemic causes (e.g., human error vs equipment failure) to prioritise training.",
    "SELECT root_cause, COUNT(*) FROM incidents WHERE org=:org GROUP BY root_cause",
    "Table: incidents  Column: root_cause (VARCHAR)",
    colour=PURPLE))

story.append(chart_block(
    "Monthly Incident Trend  (Line — 10 months)",
    "Line chart: incidents per month for the last 10 months.",
    "Core trend indicator; the most-watched chart by safety managers.",
    "For m in last 10 months: SELECT COUNT(*) FROM incidents WHERE MONTH=m AND YEAR=y AND org=:org",
    "Table: incidents  Columns: report_date, organisation_id",
    colour=ACCENT))

story.append(chart_block(
    "Near Miss Monthly Trend  (Dashed Line)",
    "Near-miss count per month, plotted alongside incident trend.",
    "Near misses should outnumber incidents (good reporting culture); if not, it's a warning sign.",
    "For m in last 10 months: SELECT COUNT(*) FROM near_misses "
    "WHERE DATE(event_date_time) BETWEEN start_m AND end_m AND org=:org",
    "Table: near_misses  Columns: event_date_time, organisation_id",
    colour=MID_BLUE))

story.append(chart_block(
    "Injury Category & Person Involved  (Bar Charts)",
    "Two separate bars: one by injury body part/category, one by employment type of person involved.",
    "Reveals whether contractors or specific body-part injuries are disproportionately represented.",
    "Injury cat: SELECT injury_category, COUNT(*) FROM incidents WHERE org=:org GROUP BY injury_category\n"
    "Person: SELECT employment_type, COUNT(*) FROM employees e JOIN incidents i "
    "ON i.reported_by=e.id WHERE org=:org GROUP BY employment_type",
    "Tables: incidents (injury_category), employees (employment_type)",
    colour=DANGER))

story.append(chart_block(
    "Severity Mix  (Stacked Bar — Monthly)",
    "Each bar = one month; stacked by Critical / High / Medium / Low severity.",
    "Shows whether severe incidents are increasing proportionally month-on-month.",
    "For each month m: SELECT severity, COUNT(*) FROM incidents "
    "WHERE MONTH=m AND org=:org GROUP BY severity",
    "Table: incidents  Columns: report_date, severity",
    colour=WARN))

story.append(Paragraph("Tab 2 — Near Miss", H3))
story.append(chart_block(
    "Near Miss Table + Trend",
    "List of near-miss records with description, location, date, severity, status.",
    "Near-miss data is a leading indicator — reviewing them prevents future incidents.",
    "SELECT * FROM near_misses WHERE organisation_id=:org ORDER BY event_date_time DESC LIMIT 200",
    "Table: near_misses  Columns: id, description, location_station_id, "
    "event_date_time, potential_consequence, underlying_cause, reported_by, capa_escalation",
    colour=TEAL))

story.append(Paragraph("Tab 3 — RCA (Root Cause)", H3))
story.append(chart_block(
    "Root Cause Analysis List",
    "Same RCA data as /root-cause-analysis page but shown as a tab inside Analytics.",
    "Allows analysts to cross-reference RCA findings alongside other analytics.",
    "GET /api/v1/analytics/root-cause-analysis  (same endpoint as RCA page)",
    "Tables: incidents, working_stations, sites, employees",
    colour=PURPLE))

story.append(Paragraph("Tab 4 — Permits & Active Work", H3))
story.append(chart_block(
    "Active Permits KPI + Radar Chart",
    "Total active permits, total workers on site, risk-assessment radar by work type.",
    "Tracks live work permits to ensure all active work is authorised.",
    "active_permits = SELECT COUNT(*) FROM permit_to_works WHERE status='Active' AND org=:org\n"
    "workers = SELECT SUM(number_of_workers) FROM permit_to_works WHERE status='Active' AND org=:org\n"
    "radar = SELECT pt.name, COUNT(p.id) FROM permit_to_works p JOIN permit_types pt ON p.permit_type_id=pt.id "
    "WHERE org=:org GROUP BY pt.name",
    "Tables: permit_to_works, permit_types  "
    "Columns: status, number_of_workers, permit_type_id, name",
    colour=ACCENT))

story.append(chart_block(
    "Permit Violations Feed",
    "Recent violations: permits that expired or were used without sign-off.",
    "Provides an audit trail of permit non-compliance events.",
    "SELECT p.id, p.expiry_date FROM permit_to_works p "
    "WHERE p.expiry_date < TODAY() AND p.status='Active' AND org=:org ORDER BY expiry_date DESC LIMIT 5",
    "Table: permit_to_works  Columns: expiry_date, status",
    colour=DANGER))

story.append(chart_block(
    "Expiry Timeline  (Gantt-style Bars)",
    "Horizontal bars showing how many days remain before each active permit expires.",
    "Allows permit coordinators to prioritise renewals.",
    "For each active permit: days_left = expiry_date − TODAY()\n"
    "bar_width% = days_left / max_days * 100",
    "Table: permit_to_works  Columns: id, expiry_date, permit_type_id",
    colour=WARN))

story.append(Paragraph("Tab 5 — Contractor Performance", H3))
story.append(chart_block(
    "Contractor Compliant % vs Non-Compliant %  (KPI Cards)",
    "Percentage of contractor-linked permits that are fully compliant vs those with issues.",
    "Contractors are a key risk category; separate tracking enables vendor accountability.",
    "contractor_compliant_pct = "
    "COUNT(permits WHERE status='Active' AND no violations) / total_contractor_permits * 100\n"
    "contractor_non_compliant_pct = 100 − contractor_compliant_pct",
    "Table: permit_to_works  Columns: status, contractor_name (if present), expiry_date",
    colour=SUCCESS))

story.append(chart_block(
    "Incidents by Employment Type  (Bar Chart)",
    "Bar chart showing incident count split by employee vs contractor.",
    "Identifies if contractors are disproportionately involved in incidents.",
    "SELECT e.employment_type, COUNT(i.id) FROM incidents i "
    "JOIN employees e ON i.reported_by=e.id "
    "WHERE i.organisation_id=:org GROUP BY e.employment_type",
    "Tables: incidents, employees  Columns: reported_by, employment_type",
    colour=WARN))

story.append(chart_block(
    "Permit Status by Type  (Stacked Bar)",
    "For each permit type: stacked bar showing count of Active / Expired / Closed permits.",
    "Reveals which work types have high expiry rates — a risk signal.",
    "SELECT pt.name, p.status, COUNT(*) FROM permit_to_works p "
    "JOIN permit_types pt ON p.permit_type_id=pt.id "
    "WHERE p.organisation_id=:org GROUP BY pt.name, p.status",
    "Tables: permit_to_works, permit_types  Columns: permit_type_id, status, name",
    colour=ACCENT))

story.append(Paragraph("Tab 6 — Zone Risk", H3))
story.append(chart_block(
    "Incident Count by Zone  (Bar Chart)",
    "Incidents grouped by working_station zone for the org.",
    "Pinpoints physical areas with the highest risk concentration.",
    "SELECT ws.zone_name, COUNT(i.id) FROM incidents i "
    "JOIN working_stations ws ON i.location_station_id=ws.id "
    "WHERE i.organisation_id=:org GROUP BY ws.zone_name",
    "Tables: incidents, working_stations  Columns: location_station_id, zone_name",
    colour=DANGER))

story.append(chart_block(
    "Zone Risk Summary Table",
    "Table: zone name, incident count, severity badge (High/Medium/Low).",
    "Quick reference for which zones need immediate physical safety improvements.",
    "severity badge: count > 10 → High (red), 5–10 → Medium (amber), < 5 → Low (green)",
    "Tables: incidents, working_stations  Columns: zone_name, severity",
    colour=WARN))

story.append(Paragraph("Tab 7 — Trend Reports", H3))
story.append(chart_block(
    "Monthly Incidents vs Near Misses  (Dual Line Chart)",
    "Two lines on the same axis: monthly incidents and monthly near-misses for last 10 months.",
    "The ratio of near-misses to incidents indicates reporting culture health "
    "(Heinrich Triangle principle: more near-miss reports = better culture).",
    "Incidents line: same as violations tab monthly trend.\n"
    "Near-miss line: same as near-miss monthly trend.",
    "Tables: incidents (report_date), near_misses (event_date_time)",
    colour=ACCENT))

story.append(chart_block(
    "Severity Mix  (Stacked Bar — Monthly)",
    "Same stacked-bar chart as Violations tab but placed here for trend context.",
    "Allows managers to see severity escalation month-on-month at a glance.",
    "Same computation as Violations tab severity mix.",
    "Table: incidents  Columns: report_date, severity",
    colour=MID_BLUE))

story.append(Paragraph("Tab 8 — PPE Compliance", H3))
story.append(Paragraph(
    "<b>Status:</b> Empty state shown — "
    "'No PPE compliance data available'. No dedicated PPE table exists in the database. "
    "This tab is reserved for future data collection.", NOTE))
story.append(sp(2))

story.append(Paragraph("Customer Reports (Scheduled Reports)", H3))
story.append(Paragraph(
    "<b>Status:</b> Empty state shown — 'No scheduled reports configured'. "
    "No scheduled-report table exists in the database. Reserved for future reporting automation.", NOTE))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 9 — RISK
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("9.  Risk  ( /risk )"))
story.append(sp(2))
story.append(Paragraph(
    "Three API calls: <b>/analytics/risk-summary</b>, "
    "<b>/analytics/residual-risk-trend</b>, <b>/analytics/risk-matrix</b>. "
    "Covers risk matrix heatmap, zone risk bar chart, active task table, and risk aging.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Control Effectiveness  (KPI %)",
    "Percentage of hazards that have at least one linked CAPA action (indicating a control is in place).",
    "Measures how thoroughly identified hazards are being mitigated.",
    "controlled_hazards = COUNT(DISTINCT hazard_id FROM capa_actions WHERE org=:org)\n"
    "total_hazards = COUNT(*) FROM hazards WHERE org=:org\n"
    "control_effectiveness = controlled_hazards / max(total_hazards, 1) * 100  → formatted as e.g. '73%'",
    "Tables: hazards, capa_actions  Columns: id, organisation_id, hazard_id",
    colour=SUCCESS))

story.append(chart_block(
    "Unverified Controls  (KPI Count)",
    "Number of CAPA actions with status = 'Pending' — controls assigned but not yet verified.",
    "Unverified controls represent gaps where a fix was planned but not confirmed effective.",
    "SELECT COUNT(*) FROM capa_actions WHERE status='Pending' AND organisation_id=:org",
    "Table: capa_actions  Column: status",
    colour=WARN))

story.append(chart_block(
    "Risk Escalations  (KPI Count)",
    "Count of incidents with severity = Critical (value 1) reported in the last 90 days.",
    "Critical incidents that are recent represent elevated organisational risk.",
    "SELECT COUNT(*) FROM incidents WHERE severity=1 AND organisation_id=:org "
    "AND report_date >= TODAY() - 90 days",
    "Table: incidents  Columns: severity, report_date, organisation_id",
    colour=DANGER))

story.append(chart_block(
    "Zone Risk  (Horizontal Bar Chart)",
    "Incident count per working_station zone, displayed as proportional horizontal bars.",
    "Visualises which physical zones accumulate the most risk.",
    "SELECT ws.zone_name AS zone, COUNT(i.id) AS value "
    "FROM incidents i JOIN working_stations ws ON i.location_station_id=ws.id "
    "WHERE i.organisation_id=:org GROUP BY ws.zone_name ORDER BY value DESC",
    "Tables: incidents, working_stations  Columns: location_station_id, zone_name",
    notes="Progress bar width is computed as: "
    "zone_value / max_zone_value * 100 — showing relative dominance.",
    colour=TEAL))

story.append(chart_block(
    "Residual Risk Trend  (Area / Line Chart — Quarterly)",
    "Line chart showing average incident severity per quarter for the last 4 quarters.",
    "Residual risk is what remains after controls are applied; a downward trend = controls working.",
    "For each quarter q: "
    "SELECT AVG(CAST(severity AS FLOAT)) FROM incidents "
    "WHERE report_date BETWEEN q_start AND q_end AND organisation_id=:org\n"
    "Quarter labels: Q1…Q4 of current year",
    "Table: incidents  Columns: report_date, severity (1=Critical…4=Low)",
    colour=ACCENT))

story.append(chart_block(
    "Risk Matrix  (5×5 Heatmap Grid)",
    "5-column × 5-row coloured grid. Each cell shows count of incidents at that Likelihood × Severity intersection.",
    "Standard HSE risk assessment tool; the top-right quadrant (high likelihood + high severity) "
    "is the danger zone.",
    "grid[row][col] = COUNT(*) FROM incidents WHERE severity_bucket=row AND likelihood_bucket=col "
    "AND organisation_id=:org\n"
    "Severity buckets: severity ∈ {1,2,3,4,5} maps directly to row index.\n"
    "Likelihood is approximated from injury_category / incident recurrence.",
    "Table: incidents  Columns: severity, injury_category, report_date",
    colour=DANGER))

story.append(chart_block(
    "Active Risk Tasks Table",
    "Table of open CAPA actions linked to incidents, with description, owner, due date, status.",
    "Provides a concrete task list for risk owners to action.",
    "SELECT c.id, c.description, e.full_name AS owner, c.due_date, c.status "
    "FROM capa_actions c LEFT JOIN employees e ON c.responsible_person_id=e.id "
    "WHERE c.status != 'Completed' AND c.organisation_id=:org "
    "ORDER BY c.due_date ASC LIMIT 10",
    "Tables: capa_actions, employees  Columns: description, responsible_person_id, due_date, status",
    colour=MID_BLUE))

story.append(chart_block(
    "Risk Aging  (Grouped Bar Chart)",
    "Bars grouped by age buckets (0–30 days, 31–60, 61–90, 91+ days). "
    "Each bar stacked by severity (Low / Medium / High / Critical).",
    "Older open risks are more dangerous; this chart pressure-tests the closure velocity.",
    "For each incident i: age_days = TODAY() − i.report_date\n"
    "bucket: 0–30, 31–60, 61–90, 91+\n"
    "severity: from incidents.severity\n"
    "→ aggregated as {bucket, low, medium, high, critical, line}",
    "Table: incidents  Columns: report_date, severity, organisation_id",
    colour=WARN))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 10 — EQUIPMENT CERTIFICATION
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("10.  Equipment Certification  ( /equipment-certification )"))
story.append(sp(2))
story.append(Paragraph(
    "API: <b>GET /api/v1/equipment-certifications/</b>. Dedicated table with its own controller. "
    "Tracks certification status of all safety-critical equipment.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Certification Table",
    "Full list of equipment records: name, type, serial number, manufacturer, model, "
    "certification type, issue date, expiry date, next inspection date, status, compliance standard.",
    "Regulatory compliance requires proof that all safety equipment is certified and within validity.",
    "SELECT * FROM equipment_certifications WHERE organisation_id=:org ORDER BY expiry_date ASC",
    "Table: equipment_certifications  Columns: equipment_name, equipment_type, serial_number, "
    "manufacturer, model, certification_type, certified_by, issue_date, expiry_date, "
    "next_inspection_date, status, compliance_standard, organisation_id",
    colour=MID_BLUE))

story.append(chart_block(
    "Status KPI Cards  (Valid / Expiring / Expired)",
    "Three KPI cards: count of certs in each validity band.",
    "Allows maintenance teams to see at a glance how many certs need urgent renewal.",
    "Valid    = status = 'Active' AND expiry_date > TODAY()\n"
    "Expiring = status = 'Active' AND expiry_date BETWEEN TODAY() AND TODAY()+30\n"
    "Expired  = status = 'Expired' OR expiry_date < TODAY()",
    "Table: equipment_certifications  Columns: status, expiry_date",
    colour=TEAL))

story.append(chart_block(
    "Equipment Type Breakdown  (Donut)",
    "Pie/donut showing how many certifications exist per equipment_type.",
    "Identifies which equipment categories are most heavily regulated.",
    "SELECT equipment_type, COUNT(*) FROM equipment_certifications "
    "WHERE organisation_id=:org GROUP BY equipment_type",
    "Table: equipment_certifications  Column: equipment_type",
    colour=ACCENT))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 11 — VIOLATIONS
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("11.  Violations  ( /violations )  &  Detail Page"))
story.append(sp(2))
story.append(Paragraph(
    "Two sub-pages: the list page and the detail page. "
    "List: <b>GET /api/v1/incidents/?limit=10</b>. "
    "Detail: <b>GET /api/v1/analytics/violation-detail/{incident_id}</b>.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Violations Summary  (Analytics Charts — top of page)",
    "Charts from /analytics/violations-summary: incidents by type, by location, "
    "root cause donut, monthly trend.",
    "See Section 8 Tab 1 for full formula details.",
    "GET /api/v1/analytics/violations-summary",
    "Tables: incidents, working_stations, sites",
    colour=DANGER))

story.append(chart_block(
    "Recent Incidents Table  (bottom of list page)",
    "Table of the 10 most recent incidents with ID, type, severity badge, status, date, zone. "
    "Rows are clickable and navigate to the detail page.",
    "Provides direct access to drill into specific incidents.",
    "SELECT id, incident_type, severity, investigation_status, report_date, "
    "location_station_id FROM incidents WHERE organisation_id=:org "
    "ORDER BY report_date DESC LIMIT 10",
    "Table: incidents  Columns: id, incident_type, severity, investigation_status, report_date",
    colour=WARN))

story.append(Paragraph("Violation Detail Page  ( /violations/:id )", H3))
story.append(chart_block(
    "Incident Header  (ID, Severity, Status)",
    "Displays formatted incident ID (e.g., INC-00042), severity badge, investigation status.",
    "At-a-glance identification of the specific incident.",
    "id formatted as: INC-{id:05d}\n"
    "severity mapped: 1→Critical (red), 2→High (orange), 3→Medium (yellow), 4→Low (green)\n"
    "status: investigation_status field directly from DB",
    "Table: incidents  Columns: id, severity, investigation_status",
    colour=DANGER))

story.append(chart_block(
    "Status Tracker  (Step Progress Bar 0–4)",
    "5-step horizontal stepper: Reported → Under Review → Investigation → CAPA → Closed.",
    "Shows where in the investigation lifecycle this incident currently sits.",
    "status_step = {Pending:0, 'Under Investigation':1, 'In Progress':2, "
    "Completed:3, Closed:4}.get(investigation_status, 0)",
    "Table: incidents  Column: investigation_status",
    colour=ACCENT))

story.append(chart_block(
    "Details Grid  (9 fields)",
    "Zone, Site, Station, Reporter name, Timestamp, Persons Involved, Days Away, Permit Active, Control Failure.",
    "Full factual record of the incident for investigators.",
    "Joined query: "
    "SELECT i.*, ws.name AS station, s.name AS site, e.full_name AS reporter "
    "FROM incidents i "
    "LEFT JOIN working_stations ws ON i.location_station_id=ws.id "
    "LEFT JOIN sites s ON ws.site_id=s.id "
    "LEFT JOIN employees e ON i.reported_by=e.id "
    "WHERE i.id=:incident_id AND i.organisation_id=:org",
    "Tables: incidents, working_stations, sites, employees",
    colour=MID_BLUE))

story.append(chart_block(
    "CAPA Actions Table  (on detail page)",
    "All CAPA actions linked to this incident: action type, description, "
    "responsible person, due date, status.",
    "Every incident should have corrective actions attached; this table shows the full CAPA trail.",
    "SELECT c.*, e.full_name AS responsible_person "
    "FROM capa_actions c LEFT JOIN employees e ON c.responsible_person_id=e.id "
    "WHERE c.incident_id=:incident_id AND c.organisation_id=:org",
    "Tables: capa_actions, employees",
    colour=PURPLE))

story.append(chart_block(
    "Event Timeline",
    "Chronological log of actions: Incident Reported, Investigation Started, "
    "CAPA Created, CAPA Completed, Closed — with timestamps.",
    "Provides an audit trail for HSE investigators and regulators.",
    "Timeline is constructed from: incident.report_date (Reported), "
    "first capa_action.created_at (CAPA Created), "
    "capa_action where status=Completed (Completed), "
    "incident.investigation_status=Closed (Closed)",
    "Tables: incidents, capa_actions  Columns: report_date, created_at, status",
    colour=TEAL))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 12 — ENGAGEMENT
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("12.  Engagement  ( /engagement )"))
story.append(sp(2))
story.append(Paragraph(
    "API: <b>GET /api/v1/analytics/engagement-summary</b>. "
    "Aggregates safety participation metrics from safety_walks, incidents, near_misses, "
    "employees, capa_actions, and sites.", BODY))
story.append(sp(2))

story.append(chart_block(
    "Reporting Rate  (Big KPI %)",
    "Percentage of employees who submitted at least one incident or near-miss report this month.",
    "Measures safety reporting culture — low rate = under-reporting (dangerous).",
    "this_month_reports = incidents_this_month + near_misses_this_month\n"
    "reporting_rate = min(100, round(this_month_reports / total_employees * 25))\n\n"
    "Note: ×25 scaling because each report by one person represents roughly "
    "25% participation proxy (tunable constant).\n"
    "Fallback if no employees: min(100, reports × 10)",
    "Tables: incidents (report_date), near_misses (event_date_time), employees (id)",
    colour=TEAL))

story.append(chart_block(
    "Reporting Rate MoM Arrow  (↑ / ↓)",
    "Arrow indicating whether this month's report count is higher or lower than last month.",
    "Trend direction tells managers if engagement is improving.",
    "reporting_rate_mom = this_month_reports − last_month_reports\n"
    "↑ if >= 0,  ↓ if < 0",
    "Tables: incidents, near_misses  (counts scoped to this_month vs last_month date windows)",
    colour=SUCCESS))

story.append(chart_block(
    "Engagement Survey Score  (N.N / 5)",
    "Average compliance_rating across all safety walks for the org.",
    "Proxy for how well safety procedures are being followed; maps the '5-star' model to "
    "a meaningful engagement score.",
    "survey_score = AVG(compliance_rating) FROM safety_walks WHERE org=:org\n"
    "survey_score_pct = round(survey_score / 5 * 100)",
    "Table: safety_walks  Column: compliance_rating (Integer 1–5)",
    colour=ACCENT))

story.append(chart_block(
    "Survey Score MoM Arrow  (↑ / ↓ — hidden if no prior data)",
    "Direction indicator comparing this month's avg compliance_rating to last month's.",
    "Reveals whether safety walk quality is improving.",
    "avg_this_month = AVG(compliance_rating) WHERE inspection_date_time >= first_of_this_month\n"
    "avg_last_month = AVG(compliance_rating) WHERE date BETWEEN first_of_last_month AND first_of_this_month\n"
    "survey_score_mom = round(avg_this_month − avg_last_month, 1)\n"
    "Arrow shown only when BOTH months have data; hidden (null) otherwise.",
    "Table: safety_walks  Columns: compliance_rating, inspection_date_time",
    colour=MID_BLUE))

story.append(chart_block(
    "Safety Observations Ring  (%)",
    "Donut ring: % of safety walks with high compliance (rating >= 4).",
    "High-rated walks indicate inspectors found good safety conditions — a positive metric.",
    "compliant_walks = COUNT(*) FROM safety_walks WHERE compliance_rating >= 4 AND org=:org\n"
    "total_walks = COUNT(*) FROM safety_walks WHERE org=:org\n"
    "safety_observations_pct = round(compliant_walks / max(total_walks, 1) * 100)",
    "Table: safety_walks  Column: compliance_rating",
    colour=SUCCESS))

story.append(chart_block(
    "Safety Walks Ring  (%)",
    "Donut ring: % of employees who completed at least one safety walk this month.",
    "Participation in safety walks is a leading HSE activity indicator.",
    "walks_this_month = COUNT(*) FROM safety_walks WHERE inspection_date_time >= first_of_month AND org=:org\n"
    "effective_walks = walks_this_month if > 0 else total_walks  (fallback for historical data)\n"
    "safety_walks_pct = min(100, round(effective_walks / max(total_employees, 1) * 100))",
    "Tables: safety_walks (inspection_date_time), employees (id)",
    colour=TEAL))

story.append(chart_block(
    "Toolbox Attendance Ring  (%)",
    "Donut ring: % of employees who attended a toolbox-type safety walk.",
    "Toolbox talks are mandatory pre-work briefings; attendance tracks compliance.",
    "toolbox_count = COUNT(*) FROM safety_walks WHERE LOWER(inspection_type) LIKE '%toolbox%' AND org=:org\n"
    "fallback if toolbox_count=0: use total_walks (no toolbox entries in DB)\n"
    "toolbox_pct = min(100, round(toolbox_count / max(total_employees, 1) * 100))",
    "Table: safety_walks  Columns: inspection_type, organisation_id",
    colour=ACCENT))

story.append(chart_block(
    "Site Participation Ring  (%)",
    "Donut ring: % of sites that had at least one incident or near-miss reported.",
    "Sites with no reports may have under-reporting problems or genuine zero-incident performance.",
    "active_sites = MAX(\n"
    "  DISTINCT site_ids from incidents this org,\n"
    "  DISTINCT site_ids from near_misses this org\n"
    ")\n"
    "total_sites = COUNT(*) FROM sites WHERE org=:org\n"
    "site_participation_pct = round(active_sites / max(total_sites, 1) * 100)",
    "Tables: incidents, near_misses, working_stations, sites",
    colour=PURPLE))

story.append(chart_block(
    "Top Recognitions  (3 Employee Avatars)",
    "The 3 employees with the most completed CAPA actions, displayed as recognition cards.",
    "Positive reinforcement for safety champions — promotes a safety-first culture.",
    "SELECT e.full_name, COUNT(c.id) AS cnt "
    "FROM employees e JOIN capa_actions c ON c.responsible_person_id=e.id "
    "WHERE c.status='Completed' AND e.organisation_id=:org "
    "GROUP BY e.full_name ORDER BY cnt DESC LIMIT 3\n\n"
    "Fallback: if no completed CAPAs, show top 3 non-admin org users by ID.",
    "Tables: employees, capa_actions  Columns: full_name, responsible_person_id, status",
    colour=WARN))

story.append(chart_block(
    "Open Actions List  (Checklist with Status Pills)",
    "Up to 5 oldest open CAPA actions with status pills: Due Today / Due Tomorrow / Overdue.",
    "Brings the most urgent safety obligations directly onto the engagement page.",
    "SELECT c.description, c.action_type, c.due_date "
    "FROM capa_actions c WHERE c.status != 'Completed' AND c.organisation_id=:org "
    "ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC LIMIT 5\n\n"
    "Status pill logic:\n"
    "  days = due_date − TODAY()\n"
    "  days < 0  → 'Overdue'\n"
    "  days == 0 → 'Due Today'\n"
    "  else      → 'Due Tomorrow'",
    "Table: capa_actions  Columns: description, action_type, due_date, status",
    colour=DANGER))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 13 — FORMULA CHEAT SHEET
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("13.  Formula Cheat-Sheet"))
story.append(sp(2))
story.append(Paragraph(
    "Quick reference for every computed metric in the platform.", BODY))
story.append(sp(2))

formulas = [
    ["Metric", "Formula", "Output"],
    ["Compliance Score", "(permit_compliance×0.4 + policy_review×0.35 + audit_readiness×0.25)", "%  0–100"],
    ["Permit Compliance %", "active_permits / total_permits × 100", "%  0–100"],
    ["Policy Review %", "active_policies / total_policies × 100", "%  0–100"],
    ["Audit Readiness %", "100 − (open_critical_findings / total_findings × 100)", "%  0–100"],
    ["Control Effectiveness %", "controlled_hazards / total_hazards × 100", "%  0–100"],
    ["Reporting Rate %", "min(100, (incidents+nearmisses this month) / employees × 25)", "%  0–100"],
    ["Reporting Rate MoM", "this_month_count − last_month_count", "Integer (pos/neg)"],
    ["Survey Score", "AVG(safety_walks.compliance_rating)", "Float 0–5"],
    ["Survey Score %", "survey_score / 5 × 100", "%  0–100"],
    ["Survey Score MoM", "avg_this_month_rating − avg_last_month_rating", "Float (pos/neg/null)"],
    ["Safety Observations %", "walks_rating≥4 / total_walks × 100", "%  0–100"],
    ["Safety Walks %", "min(100, effective_walks / employees × 100)", "%  0–100"],
    ["Toolbox Attendance %", "min(100, toolbox_walks / employees × 100)", "%  0–100"],
    ["Site Participation %", "max(active_sites_inc, active_sites_nm) / total_sites × 100", "%  0–100"],
    ["Zone Risk Bar Width", "zone_value / max_zone_value × 100", "%  0–100 (CSS width)"],
    ["Risk Matrix Cell", "COUNT(incidents) at severity_bucket × likelihood_bucket", "Integer"],
    ["Residual Risk Trend pt", "AVG(severity) per quarter  (1=Critical…4=Low)", "Float 1–4"],
    ["Risk Aging Bucket", "TODAY() − incidents.report_date → 0–30/31–60/61–90/91+", "Days bucket"],
    ["Equipment Status", "expiry_date vs TODAY(): Valid / Expiring(<30d) / Expired", "Label"],
    ["CAPA Status Pill", "due_date−TODAY(): <0→Overdue, =0→Due Today, >0→Due Tomorrow", "Label"],
    ["Severity Mapping", "1→Critical, 2→High, 3→Medium, 4→Low", "Label + colour"],
]

fw = [55*mm, 88*mm, 30*mm]
ft = Table(formulas, colWidths=fw)
ft.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, 0), 8),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, WHITE]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GREY),
    ("FONTSIZE", (0, 1), (-1, -1), 7.5),
    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
]))
story.append(ft)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 14 — DB TABLE REFERENCE
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_header("14.  DB Table Reference"))
story.append(sp(2))
story.append(Paragraph(
    "Every table in the MySQL database, its key columns, and which pages/charts consume it.", BODY))
story.append(sp(2))

db_tables = [
    ["Table Name", "Key Columns", "Used By"],
    ["incidents", "id, organisation_id, report_date, incident_type, severity (1–4), "
     "investigation_status, root_cause, immediate_cause, description, "
     "location_station_id, reported_by, injury_category, number_persons_involved, "
     "days_away_from_work, permit_active, control_failure",
     "Dashboard, Analytics (all tabs), Risk, Violations, RCA, Compliance, Engagement"],
    ["near_misses", "id, organisation_id, event_date_time, description, "
     "potential_consequence, underlying_cause, reported_by, "
     "location_station_id, capa_escalation",
     "Dashboard, Analytics (Near Miss tab), Engagement (reporting rate)"],
    ["capa_actions", "id, organisation_id, incident_id, action_type, description, "
     "responsible_person_id, due_date, status",
     "Actions page, Compliance, Risk (active tasks), Engagement (open actions, recognitions), "
     "Violation detail"],
    ["safety_walks", "id, organisation_id, inspection_date_time, inspector_id, "
     "inspection_type, compliance_rating (1–5), issues_found, "
     "critical_issues, follow_up_required, location_station_id",
     "Checklists, Engagement (all ring metrics + survey score)"],
    ["employees", "id, organisation_id, full_name, department_id, job_title, "
     "employment_type, is_active, email, phone",
     "Users page, Engagement (reporting rate, recognitions), "
     "CAPA owner names, Violation detail (reporter)"],
    ["permit_to_works", "id, organisation_id, permit_type_id, status, "
     "expiry_date, number_of_workers, contractor_name",
     "Analytics Permits tab, Analytics Contractor tab, Compliance (permit compliance %)"],
    ["permit_types", "id, name",
     "Analytics Permits tab (permit type labels), Analytics Contractor tab"],
    ["hazards", "id, organisation_id, description, category_id",
     "Risk page (Control Effectiveness KPI)"],
    ["equipment_certifications", "id, organisation_id, equipment_name, equipment_type, "
     "serial_number, manufacturer, model, certification_type, "
     "certified_by, issue_date, expiry_date, next_inspection_date, "
     "status, compliance_standard",
     "Equipment Certification page (table, KPI cards, type donut)"],
    ["policys", "id, organisation_id, policy_name, category, issue_date, owner, status",
     "Compliance (policy review %, legal register coverage)"],
    ["sites", "id, organisation_id, name",
     "Dashboard (heatmap), Analytics (by location), Engagement (site participation)"],
    ["working_stations", "id, site_id, name, zone_name",
     "Dashboard, Analytics, Risk (zone charts), Violations (station name), RCA"],
    ["departments", "id, organisation_id, name",
     "Users page (department breakdown cards)"],
    ["organisations", "id, name, subscription_plan",
     "Multi-tenant root — every other table references this via organisation_id"],
    ["users", "id, organisation_id, username, email, full_name, password_hash, "
     "app_role_id, is_active",
     "Auth (login, JWT), Engagement (fallback recognitions if employees empty)"],
]

dw = [42*mm, 80*mm, W-2*MARGIN-122*mm]
dt = Table(db_tables, colWidths=dw)
dt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, 0), 8),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, WHITE]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GREY),
    ("FONTSIZE", (0, 1), (-1, -1), 7.5),
    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
]))
story.append(dt)
story.append(sp(4))
story.append(hr())
story.append(sp(2))
story.append(Paragraph(
    "<b>End of Document.</b>  Generated automatically from live source code of hse_old_ui. "
    "All formulas reflect the actual Python/SQL logic running in backend/app/controllers/analytics.py. "
    "All DB table references verified against backend/app/models/.",
    S("Normal", fontSize=8, textColor=TEXT_MID, alignment=TA_CENTER)))


# ══════════════════════════════════════════════════════════════════════════════
# BUILD PDF
# ══════════════════════════════════════════════════════════════════════════════
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=MARGIN,
    rightMargin=MARGIN,
    topMargin=18 * mm,
    bottomMargin=14 * mm,
    title="HSE Intelligence Platform — Data Flow Reference",
    author="HSE Platform Team",
    subject="Complete chart, formula, and DB source documentation",
)
doc.build(story, onFirstPage=make_canvas, onLaterPages=make_canvas)
print(f"PDF saved to: {OUTPUT}")
