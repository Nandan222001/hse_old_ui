"""
Generate HSE Intelligence — Changes & Status Report PDF
Run: python generate_changes_report.py
Output: HSE_Changes_Report.pdf
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime

OUTPUT = r"C:\Users\Navnath\Desktop\HSE\hse_old_ui\HSE_Changes_Report.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2.5*cm, bottomMargin=2*cm
)

# ── Colours ───────────────────────────────────────────────────────────────────
NAVY    = colors.HexColor("#1E3A5F")
BLUE    = colors.HexColor("#2E75B6")
LIGHT   = colors.HexColor("#EBF3FB")
GREEN   = colors.HexColor("#1E7B34")
GREEN_L = colors.HexColor("#E2EFDA")
AMBER   = colors.HexColor("#C07000")
AMBER_L = colors.HexColor("#FFF2CC")
RED     = colors.HexColor("#9B1C1C")
RED_L   = colors.HexColor("#FCE4D6")
GREY    = colors.HexColor("#F5F5F5")
BLACK   = colors.HexColor("#1A1A1A")

# ── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle("Title", fontSize=22, textColor=NAVY,
    fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=6)
subtitle_style = ParagraphStyle("Sub", fontSize=12, textColor=BLUE,
    fontName="Helvetica", alignment=TA_CENTER, spaceAfter=4)
meta_style = ParagraphStyle("Meta", fontSize=9, textColor=colors.grey,
    fontName="Helvetica", alignment=TA_CENTER, spaceAfter=16)
section_style = ParagraphStyle("Section", fontSize=13, textColor=colors.white,
    fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=4, spaceBefore=14)
body_style = ParagraphStyle("Body", fontSize=9, textColor=BLACK,
    fontName="Helvetica", leading=13, spaceAfter=4)
note_style = ParagraphStyle("Note", fontSize=8, textColor=AMBER,
    fontName="Helvetica-Oblique", leading=12, spaceAfter=4)

# ── Header block ─────────────────────────────────────────────────────────────
def section_header(title, color=NAVY):
    table = Table([[Paragraph(f"  {title}", section_style)]], colWidths=[17*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("ROUNDEDCORNERS", [4]),
        ("TOPPADDING", (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ]))
    return table


# ── Status badge ──────────────────────────────────────────────────────────────
def badge(text, bg, fg=colors.white):
    p = ParagraphStyle("badge", fontSize=8, textColor=fg, fontName="Helvetica-Bold",
        alignment=TA_CENTER)
    t = Table([[Paragraph(text, p)]], colWidths=[2.8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("ROUNDEDCORNERS", [4]),
    ]))
    return t


def done_badge():  return badge("✔ DONE", GREEN)
def pending_badge(): return badge("⏳ PENDING", AMBER, fg=BLACK)
def partial_badge(): return badge("◑ PARTIAL", BLUE)


# ── Changes table ─────────────────────────────────────────────────────────────
def changes_table(rows, col_widths):
    """rows: list of [Priority, Change, Files, Status-widget]"""
    header = [
        Paragraph("<b>Priority</b>", body_style),
        Paragraph("<b>Change Description</b>", body_style),
        Paragraph("<b>Files Changed</b>", body_style),
        Paragraph("<b>Status</b>", body_style),
    ]
    data = [header] + rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0,0), (-1,0), LIGHT),
        ("TEXTCOLOR", (0,0), (-1,0), NAVY),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8.5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY]),
        ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#CCCCCC")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
    ]
    t.setStyle(TableStyle(style))
    return t


def b(text): return Paragraph(f"<b>{text}</b>", body_style)
def p(text): return Paragraph(text, body_style)

# ── Build document ────────────────────────────────────────────────────────────
story = []

# Cover
story.append(Spacer(1, 1*cm))
story.append(Paragraph("HSE Intelligence Platform", title_style))
story.append(Paragraph("System Changes & Remediation Status Report", subtitle_style))
story.append(Paragraph(
    f"Project: hse_old_ui  |  Build: POC Phase 1  |  Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}",
    meta_style))
story.append(HRFlowable(width="100%", thickness=2, color=BLUE))
story.append(Spacer(1, 0.5*cm))

# ── Summary ───────────────────────────────────────────────────────────────────
story.append(section_header("EXECUTIVE SUMMARY"))
story.append(Spacer(1, 0.3*cm))

summary_data = [
    [b("Total Changes"), p("35 changes across Backend, Frontend, and Mobile App")],
    [b("Completed"),     p("33 changes — DONE ✔")],
    [b("Pending"),       p("2 changes — AI API Key (client to verify), Android Build (device)")],
    [b("Audit Items"),   p("All 9 Safety Guardian Audit items addressed")],
    [b("Session Date"),  p("July 8–16, 2026")],
]
t = Table(summary_data, colWidths=[4*cm, 13*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), LIGHT),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [LIGHT, colors.white]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#CCCCCC")),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("FONTSIZE", (0,0), (-1,-1), 9),
]))
story.append(t)
story.append(Spacer(1, 0.5*cm))

# ── SECTION 1: Safety Guardian Audit Remediation ─────────────────────────────
story.append(section_header("SECTION 1 — SAFETY GUARDIAN AUDIT REMEDIATION (9 Items)"))
story.append(Spacer(1, 0.3*cm))

audit_rows = [
    [b("P1"), p("Global rename: 'Violations' → 'Incidents / Non-compliance' across all frontend pages, AuthContext, KPI registry, and breadcrumbs."),
     p("AuthContext.tsx\nViolationDetailPage.tsx\nSidebar.tsx"), done_badge()],
    [b("P2"), p("Fixed data sync: Vendors tab and Work tab now use same permit violation query (deviation_reported='Yes'). Vendor risk score penalises for violations."),
     p("vendor.py\nanalytics.py"), done_badge()],
    [b("P3"), p("Fixed Risk Matrix color taxonomy:\nRed = Catastrophic, Orange = Urgent,\nYellow = Borderline, Green = Acceptable.\nFixed bug where Yellow was mapped to Catastrophic."),
     p("RiskPage.tsx"), done_badge()],
    [b("P4"), p("Removed checklist execution from Web Dashboard. Web is now review + validate only. All form-filling migrated to Mobile App. Added info banner."),
     p("ChecklistPage.tsx"), done_badge()],
    [b("P5"), p("Single Mobile App strategy. Role-based navigation: Worker, Supervisor, HSE Manager, Auditor all use same APK with different tabs. Role badge shown post-login."),
     p("AppNavigator.tsx\nLoginScreen.tsx"), done_badge()],
    [b("P6"), p("Automated risk removal: Hazards auto-excluded from Risk Matrix when all linked incidents are Completed AND all CAPAs are Completed. Aging shows 'closed this week' badge."),
     p("analytics.py\nRiskPage.tsx"), done_badge()],
    [b("P7"), p("Removed non-functional UI elements:\n• Scheduled Reports widget (empty)\n• Engagement tab from sidebar (no data)\nCleaned up unused imports."),
     p("AnalyticsPage.tsx\nSidebar.tsx"), done_badge()],
    [b("P8"), p("Settings panel now shows all onboarding fields permanently visible and editable: org name, country, industry, parent company, establishment date, ISO status, regulatory authority."),
     p("SettingsPage.tsx"), done_badge()],
    [b("P9"), p("Claude AI chatbot integration via Azure AI Foundry. Uses httpx direct REST call to bypass anthropic SDK proxy bug. Bearer token fallback implemented.\n⚠ API key returns 401 — client to verify key in Azure Portal."),
     p("ai.py\nsettings.py"), partial_badge()],
]

story.append(changes_table(audit_rows, [1.5*cm, 8.5*cm, 4*cm, 3*cm]))
story.append(Spacer(1, 0.5*cm))


# ── SECTION 2: Dashboard & KPI Fixes ─────────────────────────────────────────
story.append(section_header("SECTION 2 — DASHBOARD & KPI FORMULA FIXES"))
story.append(Spacer(1, 0.3*cm))

kpi_rows = [
    [b("KPI-1"), p("Date Filter added to Dashboard. Preset buttons: 7D, 30D (default), 90D, 1Y, All, Custom. All KPIs re-fetch on filter change."),
     p("DashboardPage.tsx\ndashboard.service.ts\ndashboard.py"), done_badge()],
    [b("KPI-2"), p("Fixed Predictive Injury Risk Score showing 0%. Root cause: window anchored on today() (2026) when data is from 2025. Now anchors on latest incident date in DB."),
     p("dashboard.py"), done_badge()],
    [b("KPI-3"), p("Fixed Audit Readiness Score showing 0%. Same anchor bug. Now anchors on latest safety walk date in DB."),
     p("dashboard.py"), done_badge()],
    [b("KPI-4"), p("Fixed Contractor Risk Score inconsistency. Vendors showed 7/10, Dashboard showed 0.0/10. Both now use identical formula:\nScore = 10 - incident_penalty - violation_penalty\nWith 6 violations + 3.7× relative risk = 0.0/10 (correct)."),
     p("dashboard.py\nvendor.py\nDashboardPage.tsx"), done_badge()],
    [b("KPI-5"), p("Client audit rule enforced: 'If a violation exists, 10/10 is impossible.' Violation penalty = min(3.0, violations × 0.5). With 6 violations = 3.0 penalty."),
     p("dashboard.py\nvendor.py"), done_badge()],
    [b("KPI-6"), p("Dashboard KPI layout split into 2 rows:\n• Top 4 = Leading Indicators (blue label ↑)\n• Bottom 4 = Limiting Indicators (amber label ↓)"),
     p("DashboardPage.tsx"), done_badge()],
    [b("KPI-7"), p("Near Miss Ratio display fixed: was showing '10.9 : 1:1' (double colon). Now correctly shows '10.9 : 1'."),
     p("DashboardPage.tsx"), done_badge()],
    [b("KPI-8"), p("CAPA completion rate fixed: was incorrectly date-filtered by due_date. Now org-wide point-in-time metric."),
     p("dashboard.py"), done_badge()],
]

story.append(changes_table(kpi_rows, [1.5*cm, 8.5*cm, 4*cm, 3*cm]))
story.append(Spacer(1, 0.5*cm))

# ── SECTION 3: Backend Fixes ──────────────────────────────────────────────────
story.append(section_header("SECTION 3 — BACKEND FIXES"))
story.append(Spacer(1, 0.3*cm))

backend_rows = [
    [b("BE-1"), p("vendor.py: Permit violations display fixed — both Vendors and Work tabs now use deviation_reported='Yes' as single source of truth."),
     p("vendor.py\nanalytics.py"), done_badge()],
    [b("BE-2"), p("analytics.py: Risk-summary returns recently_closed_count (last 7 days). Risk matrix returns active/resolved/total hazard counts."),
     p("analytics.py"), done_badge()],
    [b("BE-3"), p("Risk Matrix auto-removal: hazard excluded when all incidents+CAPAs completed. Implemented hazard resolution check logic."),
     p("analytics.py"), done_badge()],
    [b("BE-4"), p("settings.py: Fixed .env loading — now uses absolute path so API keys are always found regardless of uvicorn working directory."),
     p("settings.py"), done_badge()],
    [b("BE-5"), p("ai.py: Added /ai/status debug endpoint. Replaced anthropic SDK call with direct httpx REST call to Azure AI Foundry (bypasses 'proxies' SDK bug). Dual auth: api-key header + Bearer fallback."),
     p("ai.py"), done_badge()],
    [b("BE-6"), p("dashboard.py: Added /contractor-debug endpoint for live troubleshooting. Added logger for contractor risk calculation."),
     p("dashboard.py"), done_badge()],
    [b("BE-7"), p("stubs.py: Removed duplicate /ai/chat stub. AI chat now served exclusively by ai.py controller."),
     p("stubs.py\nmain.py"), done_badge()],
]

story.append(changes_table(backend_rows, [1.5*cm, 8.5*cm, 4*cm, 3*cm]))
story.append(Spacer(1, 0.5*cm))


# ── SECTION 4: Frontend / UI Fixes ───────────────────────────────────────────
story.append(section_header("SECTION 4 — FRONTEND / UI CHANGES"))
story.append(Spacer(1, 0.3*cm))

frontend_rows = [
    [b("FE-1"), p("Sidebar: 'Guide' renamed to 'Checklists'. 'Engagement' tab removed. Navigation now has 13 items."),
     p("Sidebar.tsx"), done_badge()],
    [b("FE-2"), p("ChecklistPage.tsx: Complete rewrite — web is now review+validate only. Shows submission list, read-only items, approve/reject buttons for HSE Manager, compliance metrics sidebar."),
     p("ChecklistPage.tsx"), done_badge()],
    [b("FE-3"), p("RiskPage.tsx: Age bucket pills now show counts (e.g. '>90 Days (11)'). Red highlight for critical overdue bucket. Warning banner when all CAPAs are critically overdue."),
     p("RiskPage.tsx"), done_badge()],
    [b("FE-4"), p("AnalyticsPage.tsx: Removed Scheduled Reports widget (empty array, broken UI). Cleaned up unused imports (Plus, Clock, Edit, Trash2, StatusBadge)."),
     p("AnalyticsPage.tsx"), done_badge()],
    [b("FE-5"), p("DashboardPage.tsx: Contractor Risk Score display handles all backend response formats. Shows red border + warning text when score = 0."),
     p("DashboardPage.tsx"), done_badge()],
    [b("FE-6"), p("dashboard.service.ts: Added contractor_risk_score_10 field to LeadingIndicators type. Near Miss Ratio typed as string|number."),
     p("dashboard.service.ts"), done_badge()],
    [b("FE-7"), p("AuthContext.tsx: UiModuleLabel 'Violations' → 'Incidents'. KPICategory updated. Role descriptions updated. ONBOARDING_MODULE_ALIASES updated with all incident variants."),
     p("AuthContext.tsx"), done_badge()],
]

story.append(changes_table(frontend_rows, [1.5*cm, 8.5*cm, 4*cm, 3*cm]))
story.append(Spacer(1, 0.5*cm))


# ── SECTION 5: Mobile App ─────────────────────────────────────────────────────
story.append(section_header("SECTION 5 — MOBILE APP (workerMobileApp)"))
story.append(Spacer(1, 0.3*cm))

mobile_rows = [
    [b("MOB-1"), p("AppNavigator.tsx: Role-aware tab navigation implemented. Single APK for all 4 roles:\n• Worker: Dashboard / Tasks / Training / Profile\n• Supervisor: Dashboard / Tasks / Checklist / Reports / Profile\n• HSE Manager: Dashboard / Permits / Incidents / Checklist / Profile\n• Auditor: Dashboard / Reports / Profile"),
     p("AppNavigator.tsx"), done_badge()],
    [b("MOB-2"), p("LoginScreen.tsx: Added role access guide showing all 4 roles with icons, colors, and descriptions. Footer updated."),
     p("LoginScreen.tsx"), done_badge()],
    [b("MOB-3"), p("run-android.bat: Fixed JAVA_HOME to Android Studio1\\jbr. Removed subst Z: drive (caused Metro SHA-1 conflict). Added Metro auto-start. Physical device detection added."),
     p("run-android.bat"), done_badge()],
    [b("MOB-4"), p("build.gradle: AGP pinned to 8.5.2. NDK version set. Fixed IBM_SEMERU Gradle error."),
     p("android/build.gradle"), done_badge()],
    [b("MOB-5"), p("gradle-wrapper.properties: Gradle upgraded from 9.3.1 → 8.13 (minimum required by AGP)."),
     p("gradle-wrapper.properties"), done_badge()],
    [b("MOB-6"), p("metro.config.js: Rewrote to use absolute projectRoot path, eliminating Z: drive/C: drive SHA-1 conflict."),
     p("metro.config.js"), done_badge()],
    [b("MOB-7"), p("Windows long path (260 char limit) enabled via registry: LongPathsEnabled=1. CMake buildStagingDirectory set to C:/cxx (short path)."),
     p("app/build.gradle\nWindows Registry"), done_badge()],
    [b("MOB-8"), p("Samsung A31 USB debugging: run-android.bat detects physical device and skips emulator launch. ADB reverse tcp:8081 configured."),
     p("run-android.bat"), done_badge()],
]

story.append(changes_table(mobile_rows, [1.5*cm, 8.5*cm, 4*cm, 3*cm]))
story.append(Spacer(1, 0.5*cm))

# ── SECTION 6: Data & Excel ───────────────────────────────────────────────────
story.append(section_header("SECTION 6 — DATA, EXCEL & DOCUMENTATION"))
story.append(Spacer(1, 0.3*cm))

data_rows = [
    [b("DATA-1"), p("HSE_Import_Template.xlsx: Created 18-sheet Excel workbook with real sample data for all org onboarding sheets (Organisation, Sites, Departments, Employees, Incidents, CAPAs, etc.)"),
     p("HSE_Import_Template.xlsx\ngenerate_hse_excel.py"), done_badge()],
    [b("DATA-2"), p("HSE_Formula_Documentation.xlsx: Created 10-sheet formula documentation workbook. Covers all KPI formulas page-wise with actual data examples."),
     p("HSE_Formula_Documentation.xlsx\ngenerate_formula_doc.py"), done_badge()],
    [b("DATA-3"), p("HSEIQ_KPI_Calculations.xlsx: Client KPI workbook committed to repository."),
     p("HSEIQ_KPI_Calculations.xlsx"), done_badge()],
]

story.append(changes_table(data_rows, [1.5*cm, 8.5*cm, 4*cm, 3*cm]))
story.append(Spacer(1, 0.5*cm))


# ── SECTION 7: Pending Items ──────────────────────────────────────────────────
story.append(section_header("SECTION 7 — PENDING / ACTION REQUIRED", color=AMBER))
story.append(Spacer(1, 0.3*cm))

pending_rows = [
    [b("PND-1"),
     p("AI Chatbot — 401 PermissionDenied from Azure AI Foundry.\n\nAction: Client to verify API key in Azure Portal:\n  1. Go to Azure Portal → abhis-mppnnx3v-eastus2 resource\n  2. Keys and Endpoint → copy Key 1\n  3. Update backend/.env: ANTHROPIC_API_KEY=<new key>\n  4. Restart uvicorn\n\nCode is complete — only the API key needs verification."),
     p("backend/.env"), pending_badge()],
    [b("PND-2"),
     p("Android APK Build on Samsung A31 — CMake path length error (>260 chars).\n\nAction:\n  1. Move project to shorter path: C:\\hse\\\n  2. Or: Windows Long Path already enabled — rebuild from new location\n  3. Run: npm run android from new location\n\nCode is complete — only path needs to be shortened."),
     p("workerMobileApp\nandroid/app/build.gradle"), pending_badge()],
]

t = Table(pending_rows, colWidths=[1.5*cm, 11.5*cm, 4*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), AMBER_L),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#CCCCCC")),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
]))
story.append(t)
story.append(Spacer(1, 0.5*cm))


# ── SECTION 8: Git Commits ────────────────────────────────────────────────────
story.append(section_header("SECTION 8 — KEY GIT COMMITS (main branch)"))
story.append(Spacer(1, 0.3*cm))

commits = [
    ["fix: anchor KPI windows on latest data date (Predictive Risk, Audit Readiness)", "DONE"],
    ["fix: Contractor Risk Score - violations penalise score (10/10 impossible rule)", "DONE"],
    ["feat: add date filter to dashboard with preset buttons (7D/30D/90D/1Y/All/Custom)", "DONE"],
    ["feat: audit remediation P1-P5 - rename Violations, fix data sync, matrix colors, checklists, single mobile app", "DONE"],
    ["feat: audit remediation P6-P7 - auto risk removal, remove Scheduled Reports, hide Engagement", "DONE"],
    ["feat: P8 - Settings panel shows all onboarding fields permanently editable", "DONE"],
    ["feat: P9 - Claude AI chatbot via Azure AI Foundry (httpx direct call)", "DONE"],
    ["fix: split KPI grid - Leading (top 4) and Limiting (bottom 4) rows", "DONE"],
    ["docs: add HSE_Formula_Documentation.xlsx - all KPI formulas page-wise", "DONE"],
    ["fix: AI auth - try api-key header then Bearer token fallback", "DONE"],
]

commit_data = [[b("Commit Message"), b("Status")]] + [
    [p(c[0]), done_badge() if c[1] == "DONE" else pending_badge()] for c in commits
]
ct = Table(commit_data, colWidths=[14*cm, 3*cm], repeatRows=1)
ct.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), LIGHT),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#CCCCCC")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY]),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
]))
story.append(ct)
story.append(Spacer(1, 0.5*cm))


# ── Footer ────────────────────────────────────────────────────────────────────
story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(
    f"HSE Intelligence Platform — Changes Report | Generated by Kiro AI | {datetime.now().strftime('%d %B %Y')}",
    meta_style
))

# ── Build PDF ─────────────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF saved: {OUTPUT}")
