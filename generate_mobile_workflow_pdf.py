"""
Generate HSE Mobile App Workflow PDF — Corporate Style
Run: python generate_mobile_workflow_pdf.py
Output: HSE_Mobile_App_Workflows.pdf
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from datetime import datetime

OUTPUT = r"C:\Users\Navnath\Desktop\HSE\hse_old_ui\HSE_Mobile_App_Workflows.pdf"

doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm, topMargin=2.5*cm, bottomMargin=2*cm)

# ── Colours ───────────────────────────────────────────────────────────────────
NAVY = colors.HexColor("#0B3D91")
BLUE = colors.HexColor("#1D4ED8")
LIGHT_BLUE = colors.HexColor("#EBF5FF")
GREEN = colors.HexColor("#15803D")
GREEN_L = colors.HexColor("#DCFCE7")
AMBER = colors.HexColor("#B45309")
AMBER_L = colors.HexColor("#FEF3C7")
RED = colors.HexColor("#DC2626")
PURPLE = colors.HexColor("#7C3AED")
GREY = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#E2E8F0")

# ── Styles ────────────────────────────────────────────────────────────────────
title_s = ParagraphStyle("T", fontSize=24, textColor=NAVY, fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4)
subtitle_s = ParagraphStyle("ST", fontSize=13, textColor=BLUE, fontName="Helvetica", alignment=TA_CENTER, spaceAfter=4)
meta_s = ParagraphStyle("M", fontSize=9, textColor=colors.grey, fontName="Helvetica", alignment=TA_CENTER, spaceAfter=16)
h1_s = ParagraphStyle("H1", fontSize=16, textColor=colors.white, fontName="Helvetica-Bold", spaceAfter=4)
h2_s = ParagraphStyle("H2", fontSize=12, textColor=NAVY, fontName="Helvetica-Bold", spaceAfter=4, spaceBefore=10)
body_s = ParagraphStyle("B", fontSize=9.5, textColor=colors.HexColor("#1A1A1A"), fontName="Helvetica", leading=14, spaceAfter=3)
step_s = ParagraphStyle("Step", fontSize=9.5, textColor=colors.HexColor("#1A1A1A"), fontName="Helvetica", leading=14, leftIndent=12)
note_s = ParagraphStyle("Note", fontSize=8.5, textColor=AMBER, fontName="Helvetica-Oblique", leading=12)
api_s = ParagraphStyle("API", fontSize=8, textColor=colors.HexColor("#475569"), fontName="Courier", leading=11, leftIndent=20)


def section_banner(title, bg_color=NAVY):
    t = Table([[Paragraph(f"  {title}", h1_s)]], colWidths=[17*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg_color),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    return t


def role_badge(role, color):
    p = ParagraphStyle("badge", fontSize=10, textColor=colors.white, fontName="Helvetica-Bold", alignment=TA_CENTER)
    t = Table([[Paragraph(role, p)]], colWidths=[4*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ]))
    return t


def tab_row(tabs):
    cells = []
    for tab in tabs:
        cells.append(Paragraph(f"<b>{tab}</b>", ParagraphStyle("tab", fontSize=9, textColor=BLUE, fontName="Helvetica-Bold", alignment=TA_CENTER)))
    t = Table([cells], colWidths=[3.4*cm]*len(tabs))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), LIGHT_BLUE),
        ("GRID", (0,0), (-1,-1), 0.5, BORDER),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return t


def flow_step(number, title, details, api=None):
    elements = []
    elements.append(Paragraph(f"<b>Step {number}:</b> {title}", body_s))
    for d in details:
        elements.append(Paragraph(f"→ {d}", step_s))
    if api:
        elements.append(Paragraph(f"API: {api}", api_s))
    elements.append(Spacer(1, 0.2*cm))
    return elements

story = []

# ══════════════════════════════════════════════════════════════════════════════
# COVER PAGE
# ══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 3*cm))
story.append(Paragraph("HSE Intelligence Platform", title_s))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Mobile Application — Role Workflow Guide", subtitle_s))
story.append(Spacer(1, 0.5*cm))
story.append(HRFlowable(width="60%", thickness=2, color=BLUE))
story.append(Spacer(1, 0.8*cm))
story.append(Paragraph("Single APK · 4 Roles · Role-Based Navigation", ParagraphStyle("c", fontSize=11, textColor=colors.HexColor("#475569"), fontName="Helvetica", alignment=TA_CENTER)))
story.append(Spacer(1, 2*cm))

cover_data = [
    ["Worker", "👷", "Report incidents, near misses, complete tasks, view training"],
    ["Supervisor", "🦺", "Submit checklists, report events, update CAPA progress"],
    ["HSE Manager", "🛡️", "Approve permits, validate checklists, conduct safety walks, assign CAPAs"],
    ["Auditor", "🔍", "Read-only access to all reports and compliance data"],
]
ct = Table(
    [[Paragraph(f"<b>{r[0]}</b>", body_s), Paragraph(r[1], body_s), Paragraph(r[2], body_s)] for r in cover_data],
    colWidths=[3.5*cm, 1.5*cm, 12*cm]
)
ct.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), GREY),
    ("GRID", (0,0), (-1,-1), 0.5, BORDER),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
]))
story.append(ct)
story.append(Spacer(1, 2*cm))
story.append(Paragraph(f"Document Version: 1.0  |  Date: {datetime.now().strftime('%d %B %Y')}  |  Build: POC Phase 1", meta_s))
story.append(PageBreak())


# ══════════════════════════════════════════════════════════════════════════════
# WORKER WORKFLOW
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_banner("WORKER WORKFLOW", BLUE))
story.append(Spacer(1, 0.3*cm))
story.append(role_badge("👷 Worker", BLUE))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>Tabs:</b>", body_s))
story.append(tab_row(["Dashboard", "Tasks", "Training", "Profile"]))
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("<b>Login Flow</b>", h2_s))
for e in flow_step(1, "Login", ["Enter Employee ID + PIN", "Backend validates credentials", "JWT token issued with role='Worker'", "App navigates to Worker tabs"], "POST /api/v1/auth/login"):
    story.append(e)

story.append(Paragraph("<b>Dashboard</b>", h2_s))
for e in flow_step(2, "View Dashboard", ["See assigned site, zone, shift schedule", "Quick action buttons visible: Report Incident, Report Near Miss"]):
    story.append(e)

story.append(Paragraph("<b>Report Incident</b>", h2_s))
for e in flow_step(3, "Report Incident", ["Tap 'Report Incident' button", "Fill form: incident type, severity, description, location", "Select hazard category", "Submit form"], "POST /api/v1/incidents"):
    story.append(e)
story.append(Paragraph("Backend: Creates incident record, auto-flags CAPA generation if severity is Lost Time or Critical.", note_s))

story.append(Paragraph("<b>Report Near Miss</b>", h2_s))
for e in flow_step(4, "Report Near Miss", ["Tap 'Report Near Miss' button", "Fill: description, potential consequence, underlying cause", "Select associated hazard", "Submit"], "POST /api/v1/near-misses"):
    story.append(e)

story.append(Paragraph("<b>Tasks</b>", h2_s))
for e in flow_step(5, "View & Perform Tasks", ["See list of assigned tasks for today", "Tap task → PerformTask screen", "Complete task actions", "Mark as complete"]):
    story.append(e)

story.append(Paragraph("<b>Training</b>", h2_s))
for e in flow_step(6, "Safety Training", ["View assigned training modules", "Tap module → SafetyTrainingDetail screen", "Complete quiz or mark attendance"], "GET /api/v1/training-programs"):
    story.append(e)

story.append(Paragraph("<b>Profile</b>", h2_s))
for e in flow_step(7, "Profile & Settings", ["View name, role, site, department", "Change password", "Logout"]):
    story.append(e)

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# SUPERVISOR WORKFLOW
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_banner("SUPERVISOR WORKFLOW", GREEN))
story.append(Spacer(1, 0.3*cm))
story.append(role_badge("🦺 Supervisor", GREEN))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>Tabs:</b>", body_s))
story.append(tab_row(["Dashboard", "Tasks", "Checklist", "Reports", "Profile"]))
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("<b>Checklist Submission (Primary Workflow)</b>", h2_s))
for e in flow_step(1, "Select Checklist Type", ["Daily Safety Walk", "Hot Work Pre-Task", "Working at Height", "End of Shift Handover"]):
    story.append(e)
for e in flow_step(2, "Create Draft", ["Select site, zone, shift", "Set checklist date", "Tap 'Create Draft'"], "POST /api/v1/checklists/submissions"):
    story.append(e)
for e in flow_step(3, "Fill Checklist Items", ["Each item: Yes/No/NA response", "Add remarks for non-compliant items", "All items visible with section headers"]):
    story.append(e)
for e in flow_step(4, "Save Draft (optional)", ["Save progress without submitting", "Can return later to complete"], "PUT /api/v1/checklists/submissions/{uuid}/items"):
    story.append(e)
for e in flow_step(5, "Submit for Validation", ["Tap 'Submit' button", "Status changes: draft → submitted", "Goes to HSE Manager queue for validation"], "POST /api/v1/checklists/submissions/{uuid}/submit"):
    story.append(e)
story.append(Paragraph("After submission: HSE Manager receives notification, reviews items, and approves/rejects.", note_s))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Report Incident / Near Miss</b>", h2_s))
for e in flow_step(6, "Report Events", ["Same flow as Worker (Report Incident / Near Miss)", "Supervisor can also see team's reported incidents in Reports tab"]):
    story.append(e)

story.append(Paragraph("<b>CAPA Action Update</b>", h2_s))
for e in flow_step(7, "Update CAPA Progress", ["View assigned CAPA actions in Tasks tab", "Update status: Open → In Progress → request close", "Add progress notes"], "PATCH /api/v1/capa-actions/{id}"):
    story.append(e)

story.append(Paragraph("<b>Reports</b>", h2_s))
for e in flow_step(8, "View Reports", ["Submitted checklists history with status (approved/rejected)", "Incidents reported by team", "Near misses from shift"]):
    story.append(e)

story.append(PageBreak())


# ══════════════════════════════════════════════════════════════════════════════
# HSE MANAGER WORKFLOW
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_banner("HSE MANAGER WORKFLOW", PURPLE))
story.append(Spacer(1, 0.3*cm))
story.append(role_badge("🛡️ HSE Manager", PURPLE))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>Tabs:</b>", body_s))
story.append(tab_row(["Dashboard", "Permits", "Incidents", "Checklist", "Profile"]))
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("<b>Permit to Work Management</b>", h2_s))
for e in flow_step(1, "View Permit Requests", ["List of all permit requests (Hot Work, Confined Space, WAH, etc.)", "Filter by status: Pending, Active, Closed"]):
    story.append(e)
for e in flow_step(2, "Approve/Reject Permit", ["Tap permit → Review: workers, location, duration, risk level", "Approve → status becomes 'Active'", "Reject → with rejection notes"], "PATCH /api/v1/permits-to-work/{id}"):
    story.append(e)
for e in flow_step(3, "Create New Permit", ["Fill: permit type, location, work description, duration", "Assign issuer and approver", "Set validity start/end times"], "POST /api/v1/permits-to-work"):
    story.append(e)

story.append(Paragraph("<b>Checklist Validation</b>", h2_s))
for e in flow_step(4, "Review Submitted Checklists", ["View queue of submitted checklists (from Supervisors)", "Tap checklist → See all item responses and remarks"]):
    story.append(e)
for e in flow_step(5, "Validate", ["Approve: all items satisfactory", "Reject: non-compliant items found, add notes", "Status: submitted → approved/rejected"], "POST /api/v1/checklists/submissions/{uuid}/validate"):
    story.append(e)

story.append(Paragraph("<b>Incident Management & CAPA</b>", h2_s))
for e in flow_step(6, "View All Incidents", ["List of all incidents with severity badges", "Tap → full detail: timeline, root cause, CAPA actions"]):
    story.append(e)
for e in flow_step(7, "Create CAPA Action", ["From incident detail → 'Create CAPA'", "Fill: action type (Corrective/Preventive), description", "Assign to supervisor, set due date"], "POST /api/v1/capa-actions"):
    story.append(e)
for e in flow_step(8, "Update Investigation Status", ["Mark investigation: In Progress → Completed"], "PATCH /api/v1/incidents/{id}"):
    story.append(e)

story.append(Paragraph("<b>Conduct Safety Walk</b>", h2_s))
for e in flow_step(9, "Safety Walk", ["Select location/station", "Rate: housekeeping (1-5), compliance (1-5)", "Log issues found, critical issues count", "Mark follow-up required (Yes/No)", "Submit walk"], "POST /api/v1/safety-walks"):
    story.append(e)
story.append(Paragraph("Safety walks directly update: Dashboard compliance rating, Audit Readiness Score, Compliance Trend chart.", note_s))

story.append(PageBreak())


# ══════════════════════════════════════════════════════════════════════════════
# AUDITOR WORKFLOW
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_banner("AUDITOR WORKFLOW", AMBER))
story.append(Spacer(1, 0.3*cm))
story.append(role_badge("🔍 Auditor", colors.HexColor("#B45309")))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>Tabs:</b>", body_s))
story.append(tab_row(["Dashboard", "Reports", "Profile"]))
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("<b>⚠️ READ-ONLY — No create/update/delete permissions</b>", ParagraphStyle("warn", fontSize=10, textColor=RED, fontName="Helvetica-Bold", spaceAfter=6)))
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("<b>Dashboard</b>", h2_s))
for e in flow_step(1, "View Compliance Summary", ["Leading indicators (TRIR, LTIFR, DART)", "Compliance trend chart", "Open CAPA count", "Active permits count"]):
    story.append(e)

story.append(Paragraph("<b>Reports (All Read-Only)</b>", h2_s))
for e in flow_step(2, "View Incidents", ["All incidents list with severity, date, location", "Tap for full detail (read-only)"], "GET /api/v1/incidents"):
    story.append(e)
for e in flow_step(3, "View Near Misses", ["All near miss reports with potential consequence"], "GET /api/v1/near-misses"):
    story.append(e)
for e in flow_step(4, "View Checklists", ["All submitted/approved/rejected checklists", "View item responses (cannot modify)"], "GET /api/v1/checklists/submissions"):
    story.append(e)
for e in flow_step(5, "View CAPA Actions", ["All CAPA actions with status, due date, assignee"], "GET /api/v1/capa-actions"):
    story.append(e)
for e in flow_step(6, "View Safety Walks", ["Historical inspection records", "Compliance and housekeeping ratings"], "GET /api/v1/safety-walks"):
    story.append(e)
for e in flow_step(7, "View Equipment Certifications", ["All equipment certs with expiry dates", "Overdue inspections flagged"], "GET /api/v1/equipment-certifications"):
    story.append(e)

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Auditor cannot: report incidents, submit checklists, approve permits, create CAPAs, or modify any data.", note_s))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# DATA FLOW & PERMISSION MATRIX
# ══════════════════════════════════════════════════════════════════════════════
story.append(section_banner("DATA FLOW: APK → BACKEND → WEB DASHBOARD"))
story.append(Spacer(1, 0.4*cm))

flow_data = [
    ["Worker reports incident", "POST /incidents", "Dashboard: Total Incidents +1, TRIR recalculates"],
    ["Supervisor submits checklist", "POST /checklists/.../submit", "HSE Manager Checklist tab: new item for validation"],
    ["HSE Manager validates checklist", "POST /checklists/.../validate", "Compliance metrics update, submission rate changes"],
    ["HSE Manager approves permit", "PATCH /permits-to-work/{id}", "Dashboard: Active Permits count +1"],
    ["HSE Manager creates CAPA", "POST /capa-actions", "Supervisor Tasks tab: new action item assigned"],
    ["HSE Manager conducts safety walk", "POST /safety-walks", "Dashboard: Audit Readiness Score updates, Compliance Trend"],
    ["Supervisor updates CAPA", "PATCH /capa-actions/{id}", "Dashboard: Open CAPA count changes"],
    ["Worker reports near miss", "POST /near-misses", "Dashboard: Near Miss Ratio updates"],
]

ft = Table(
    [[Paragraph("<b>Action</b>", body_s), Paragraph("<b>API Call</b>", body_s), Paragraph("<b>Web Dashboard Impact</b>", body_s)]] +
    [[Paragraph(r[0], body_s), Paragraph(r[1], api_s), Paragraph(r[2], body_s)] for r in flow_data],
    colWidths=[5*cm, 5*cm, 7*cm], repeatRows=1
)
ft.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY]),
    ("GRID", (0,0), (-1,-1), 0.4, BORDER),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
]))
story.append(ft)

story.append(Spacer(1, 1*cm))
story.append(section_banner("PERMISSION MATRIX"))
story.append(Spacer(1, 0.4*cm))

perm_header = ["Action", "Worker", "Supervisor", "HSE Manager", "Auditor"]
perm_data = [
    ["Report Incident",       "✅", "✅", "✅", "❌"],
    ["Report Near Miss",      "✅", "✅", "✅", "❌"],
    ["Submit Checklist",      "❌", "✅", "❌", "❌"],
    ["Validate Checklist",    "❌", "❌", "✅", "❌"],
    ["Approve/Create Permit", "❌", "❌", "✅", "❌"],
    ["Conduct Safety Walk",   "❌", "❌", "✅", "❌"],
    ["Create CAPA Action",    "❌", "❌", "✅", "❌"],
    ["Update CAPA Status",    "❌", "✅", "✅", "❌"],
    ["View All Reports",      "❌", "✅", "✅", "✅"],
    ["View Training",         "✅", "❌", "❌", "❌"],
    ["Perform Tasks",         "✅", "✅", "❌", "❌"],
]

pt = Table(
    [[Paragraph(f"<b>{h}</b>", ParagraphStyle("ph", fontSize=9, textColor=colors.white, fontName="Helvetica-Bold", alignment=TA_CENTER)) for h in perm_header]] +
    [[Paragraph(r[0], body_s)] + [Paragraph(c, ParagraphStyle("pc", fontSize=10, alignment=TA_CENTER)) for c in r[1:]] for r in perm_data],
    colWidths=[5.5*cm, 2.5*cm, 2.5*cm, 3*cm, 2.5*cm], repeatRows=1
)
pt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY]),
    ("GRID", (0,0), (-1,-1), 0.4, BORDER),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
]))
story.append(pt)

story.append(Spacer(1, 1*cm))
story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(f"HSE Intelligence Platform — Mobile App Workflow Guide | {datetime.now().strftime('%d %B %Y')}", meta_s))

# ── Build PDF ─────────────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF saved: {OUTPUT}")
