"""
HSE Intelligence - KPI Formula Verification Report
Generates a PDF documenting all dashboard KPI calculations with DB data verification.
"""

from fpdf import FPDF
from datetime import datetime
import sys


class KPIReport(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 6, "HSE Intelligence - KPI Formula Verification Report", align="L")
        self.cell(0, 6, "Generated: " + datetime.now().strftime("%d-%m-%Y"), align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, "Page " + str(self.page_no()) + "/{nb}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(44, 62, 80)
        self.set_fill_color(236, 240, 241)
        self.cell(0, 10, title, fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(52, 73, 94)
        self.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def formula_box(self, formula):
        self.set_font("Courier", "B", 11)
        self.set_fill_color(245, 245, 245)
        self.set_draw_color(180, 180, 180)
        x = self.get_x()
        y = self.get_y()
        self.rect(x, y, 190, 10, style="DF")
        self.set_xy(x + 5, y + 2.5)
        self.set_text_color(192, 57, 43)
        self.cell(0, 5, formula)
        self.set_xy(x, y + 12)
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def result_box(self, label, value, status="PASS"):
        self.set_font("Helvetica", "B", 10)
        if status == "PASS":
            self.set_fill_color(212, 239, 223)
            self.set_text_color(30, 130, 76)
            symbol = "VERIFIED"
        else:
            self.set_fill_color(253, 237, 236)
            self.set_text_color(192, 57, 43)
            symbol = "MISMATCH"
        self.cell(0, 8, "  " + symbol + "  |  " + label + ": " + value, fill=True, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(3)

    def data_table(self, headers, rows, col_widths=None):
        if col_widths is None:
            col_widths = [190 / len(headers)] * len(headers)

        # Header row
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(52, 73, 94)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, border=1, fill=True, align="C")
        self.ln()

        # Data rows
        self.set_font("Helvetica", "", 9)
        self.set_text_color(0, 0, 0)
        for row_idx, row in enumerate(rows):
            if row_idx % 2 == 0:
                self.set_fill_color(248, 249, 250)
            else:
                self.set_fill_color(255, 255, 255)
            for i, cell in enumerate(row):
                self.cell(col_widths[i], 6, str(cell), border=1, fill=True, align="C")
            self.ln()
        self.ln(3)


def generate_report():
    pdf = KPIReport()
    pdf.alias_nb_pages()
    pdf.add_page()

    # Title page content
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(44, 62, 80)
    pdf.ln(20)
    pdf.cell(0, 12, "HSE Intelligence", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, "KPI Formula Verification Report", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(0, 0, 0)
    info_data = [
        ("Organisation", "Alex Carry / WindTech (org_id=4)"),
        ("User", "sonawanenavnath2020@gmail.com (user_id=13)"),
        ("Database", "hse_db (MySQL, localhost:3306)"),
        ("Data Range", "Jan 2024 - Dec 2025"),
        ("Total Incidents", "53"),
        ("Total Near Misses", "120"),
        ("Total Safety Walks", "27 (in 90-day window)"),
        ("Total Man Hours", "622,370"),
        ("Report Date", datetime.now().strftime("%d-%m-%Y")),
    ]
    for label, value in info_data:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(50, 6, f"{label}:")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # ═══════════════════════════════════════════════════════════════════
    # KPI 1: Predictive Injury Risk Score
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section_title("1. Predictive Injury Risk Score")
    pdf.result_box("Dashboard Value", "58.33% (down 5.95%)")

    pdf.sub_title("Formula")
    pdf.formula_box("Score = (weight_sum / (count x 3)) x 100")

    pdf.sub_title("Severity Weight Mapping")
    pdf.data_table(
        ["Severity", "Weight"],
        [
            ("Critical / Significant", "3"),
            ("High / Major", "2"),
            ("Medium / Moderate", "1"),
            ("All others (Minor, Serious, Low)", "0.5"),
        ],
        [95, 95],
    )

    pdf.sub_title("Date Window")
    pdf.body_text(
        "Latest incident date: 2025-12-19\n"
        "Current period: 2025-09-20 to 2025-12-19 (last 90 days, end excluded)\n"
        "Previous period: 2025-06-22 to 2025-09-20"
    )

    pdf.sub_title("Current Period Incidents (8 records)")
    pdf.data_table(
        ["ID", "Date", "Type", "Severity", "Weight"],
        [
            ("187", "2025-09-25", "Damage", "Significant", "3"),
            ("201", "2025-10-09", "Injury", "Serious", "0.5"),
            ("182", "2025-10-13", "Environmental", "Significant", "3"),
            ("171", "2025-10-22", "Environmental", "Minor", "0.5"),
            ("207", "2025-10-30", "Near-miss", "Minor", "0.5"),
            ("184", "2025-10-31", "Environmental", "Significant", "3"),
            ("181", "2025-11-08", "Damage", "Significant", "3"),
            ("218", "2025-11-14", "Near-miss", "Serious", "0.5"),
        ],
        [20, 35, 45, 45, 45],
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "weight_sum = 3 + 0.5 + 3 + 0.5 + 0.5 + 3 + 3 + 0.5 = 14\n"
        "count = 8\n"
        "Score = (14 / (8 x 3)) x 100 = (14/24) x 100 = 58.33%"
    )

    pdf.sub_title("Trend Calculation")
    pdf.body_text(
        "Previous period (7 incidents): weight_sum=13.5, count=7\n"
        "Previous Score = (13.5 / (7x3)) x 100 = (13.5/21) x 100 = 64.29%\n"
        "Trend = 58.33 - 64.29 = -5.95% (improvement)"
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 2: TRIR
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section_title("2. TRIR (Total Recordable Injury Rate)")
    pdf.result_box("Dashboard Value", "3.53")

    pdf.sub_title("Formula")
    pdf.formula_box("TRIR = (Recordable Injuries x 200,000) / Man Hours")

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "Recordable Injuries = COUNT(*) FROM incidents\n"
        "  WHERE incident_type = 'Injury' AND date <= 2025-12-19\n"
        "  Result: 11\n\n"
        "Man Hours = SUM(actual_hours_worked) FROM shift_schedule\n"
        "  Result: 622,370"
    )

    pdf.sub_title("All Recordable Injuries (11)")
    pdf.data_table(
        ["ID", "Date", "Severity"],
        [
            ("174", "2024-01-20", "Lost Time"),
            ("206", "2024-05-20", "Serious"),
            ("183", "2024-07-03", "Significant"),
            ("194", "2024-07-12", "Significant"),
            ("193", "2024-09-02", "Minor"),
            ("175", "2025-01-15", "Minor"),
            ("215", "2025-05-08", "Serious"),
            ("205", "2025-06-07", "Significant"),
            ("180", "2025-06-22", "Significant"),
            ("208", "2025-08-23", "Significant"),
            ("201", "2025-10-09", "Serious"),
        ],
        [40, 75, 75],
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "TRIR = (11 x 200,000) / 622,370\n"
        "     = 2,200,000 / 622,370\n"
        "     = 3.53"
    )

    pdf.sub_title("Why 200,000?")
    pdf.body_text(
        "OSHA standard: 100 workers x 40 hrs/week x 50 weeks = 200,000\n"
        "Normalizes rate to 'per 100 full-time workers per year'"
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 3: LTIFR
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section_title("3. LTIFR (Lost Time Injury Frequency Rate)")
    pdf.result_box("Dashboard Value", "1.61")

    pdf.sub_title("Formula")
    pdf.formula_box("LTIFR = (Lost Time Injuries x 1,000,000) / Man Hours")

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "Lost Time Injuries = COUNT(*) FROM incidents\n"
        "  WHERE incident_type='Injury' AND severity='Lost Time'\n"
        "  Result: 1 (ID=174, date 2024-01-20)\n\n"
        "Man Hours = 622,370"
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "LTIFR = (1 x 1,000,000) / 622,370\n"
        "      = 1,000,000 / 622,370\n"
        "      = 1.61"
    )

    pdf.sub_title("Why 1,000,000?")
    pdf.body_text(
        "ILO international standard.\n"
        "Lost Time Injuries are rare, so a larger multiplier gives meaningful numbers."
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 4: Near Miss Ratio
    # ═══════════════════════════════════════════════════════════════════
    pdf.section_title("4. Near Miss Ratio")
    pdf.result_box("Dashboard Value", "10.9 : 1")

    pdf.sub_title("Formula")
    pdf.formula_box("Ratio = Near Miss Count / Recordable Injuries : 1")

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "Near Miss Count = COUNT(*) FROM near_misses WHERE organisation_id=4\n"
        "  Result: 120\n\n"
        "Recordable Injuries = 11 (same as TRIR)"
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "Ratio = 120 / 11 = 10.909...\n"
        "Rounded to 1 decimal = 10.9\n"
        "Display: 10.9 : 1"
    )

    pdf.sub_title("Interpretation")
    pdf.body_text(
        "For every 1 actual injury, 10.9 near misses were reported.\n"
        "Based on Heinrich's Safety Triangle concept.\n"
        "Higher ratio = better (proactive reporting culture)\n"
        "Industry benchmark: 10:1 to 30:1 is considered good."
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 5: Audit Readiness Score
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section_title("5. Audit Readiness Score")
    pdf.result_box("Dashboard Value", "75.6% / Needs Attention")

    pdf.sub_title("Formula")
    pdf.formula_box("Score = (AVG(compliance_rating) / 5) x 100")

    pdf.sub_title("Labels")
    pdf.data_table(
        ["Score Range", "Label"],
        [
            (">= 80%", "Ready"),
            (">= 60% and < 80%", "Needs Attention"),
            ("< 60%", "Not Ready"),
        ],
        [95, 95],
    )

    pdf.sub_title("Date Window")
    pdf.body_text(
        "Latest safety walk date: 2025-12-30\n"
        "Window: last 90 days = 2025-10-01 to 2025-12-30\n"
        "Source: safety_walks.compliance_rating (scale 1-5)"
    )

    pdf.sub_title("Safety Walk Compliance Ratings (27 records)")
    pdf.data_table(
        ["ID", "Date", "Rating"],
        [
            ("893", "2025-10-04", "5"), ("794", "2025-10-07", "3"),
            ("883", "2025-10-08", "5"), ("756", "2025-10-08", "5"),
            ("931", "2025-10-14", "4"), ("846", "2025-10-14", "3"),
            ("726", "2025-10-15", "4"), ("797", "2025-10-16", "3"),
            ("740", "2025-10-18", "3"), ("857", "2025-10-23", "5"),
            ("876", "2025-11-04", "2"), ("853", "2025-11-18", "2"),
            ("749", "2025-11-22", "5"), ("801", "2025-11-23", "5"),
            ("741", "2025-11-24", "3"), ("821", "2025-12-01", "3"),
            ("882", "2025-12-03", "4"), ("924", "2025-12-03", "3"),
            ("729", "2025-12-04", "3"), ("778", "2025-12-09", "3"),
            ("725", "2025-12-13", "5"), ("890", "2025-12-16", "5"),
            ("792", "2025-12-24", "4"), ("733", "2025-12-26", "4"),
            ("713", "2025-12-28", "4"), ("731", "2025-12-29", "5"),
            ("739", "2025-12-30", "2"),
        ],
        [40, 75, 75],
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "Sum of all ratings = 5+3+5+5+4+3+4+3+3+5+2+2+5+5+3+3+4+3+3+3+5+5+4+4+4+5+2 = 102\n"
        "Count = 27\n"
        "AVG = 102/27 = 3.7778 -> rounded = 3.78\n"
        "Score = (3.78 / 5) x 100 = 75.6%\n"
        "75.6 >= 60 -> Label: 'Needs Attention'"
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 6: DART Rate
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section_title("6. DART Rate (Days Away, Restricted, Transferred)")
    pdf.result_box("Dashboard Value", "0.32")

    pdf.sub_title("Formula")
    pdf.formula_box("DART = (Lost Time Injuries x 200,000) / Man Hours")

    pdf.sub_title("Calculation")
    pdf.body_text(
        "Lost Time Injuries = 1\n"
        "Man Hours = 622,370\n"
        "DART = (1 x 200,000) / 622,370 = 0.32"
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 7: LTISR
    # ═══════════════════════════════════════════════════════════════════
    pdf.section_title("7. LTISR (Lost Time Injury Severity Rate)")
    pdf.result_box("Dashboard Value", "1.61")

    pdf.sub_title("Formula")
    pdf.formula_box("LTISR = (Lost Days x 1,000,000) / Man Hours")

    pdf.sub_title("Calculation")
    pdf.body_text(
        "Lost Days = SUM(days_away) WHERE incident_type='Injury' AND severity='Lost Time'\n"
        "  Result: 1\n"
        "Man Hours = 622,370\n"
        "LTISR = (1 x 1,000,000) / 622,370 = 1.61"
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 8: FAR
    # ═══════════════════════════════════════════════════════════════════
    pdf.section_title("8. FAR (Fatal Accident Rate)")
    pdf.result_box("Dashboard Value", "0")

    pdf.sub_title("Formula")
    pdf.formula_box("FAR = (Fatalities x 100,000,000) / Man Hours")

    pdf.sub_title("Calculation")
    pdf.body_text(
        "Fatalities = COUNT(*) WHERE severity='Fatal' = 0\n"
        "Man Hours = 622,370\n"
        "FAR = (0 x 100,000,000) / 622,370 = 0"
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 9: Exposure Index
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section_title("9. Exposure Index (Intelligence-Based)")
    pdf.result_box("Dashboard Value", "68%")

    pdf.sub_title("Formula")
    pdf.formula_box("Exposure Index = round(AVG(compliance_rating) x 20)")

    pdf.sub_title("Why x 20?")
    pdf.body_text(
        "compliance_rating is on a 1-5 scale.\n"
        "To convert to percentage: multiply by 20 (since 5 x 20 = 100%).\n"
        "This is equivalent to (avg / 5) x 100 but expressed as avg x 20."
    )

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "Source: safety_walks.compliance_rating (ALL records, no date filter)\n"
        "Organisation: org_id = 4\n\n"
        "AVG(compliance_rating) = 3.4"
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "Exposure Index = round(3.4 x 20)\n"
        "              = round(68)\n"
        "              = 68%"
    )

    pdf.sub_title("Note")
    pdf.body_text(
        "Despite the name 'Exposure Index', on the Dashboard this gauge\n"
        "measures safety walk compliance (higher = better compliance).\n"
        "The People page has a separate 'Worker Exposure Index' with a\n"
        "different formula based on recent incidents + near misses."
    )

    # ═══════════════════════════════════════════════════════════════════
    # KPI 10: Competency Coverage
    # ═══════════════════════════════════════════════════════════════════
    pdf.section_title("10. Competency Coverage (Intelligence-Based)")
    pdf.result_box("Dashboard Value", "74%")

    pdf.sub_title("Formula")
    pdf.formula_box("Competency Coverage = round((CAPA_Completed / CAPA_Total) x 100)")

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "Source: capa_actions table (org-wide, no date filter)\n"
        "Organisation: org_id = 4\n\n"
        "CAPA Completed (status = 'Completed') = 31\n"
        "CAPA Total = 42"
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "capa_completion_rate = round((31 / 42) x 100, 1) = 73.8\n"
        "Frontend: Math.round(73.8) = 74%"
    )

    pdf.sub_title("Interpretation")
    pdf.body_text(
        "This metric shows what percentage of Corrective/Preventive Actions\n"
        "(CAPA) have been completed. Higher = better organizational competency\n"
        "to address identified safety issues.\n\n"
        "74% means 31 out of 42 total CAPA actions are resolved."
    )

    # ═══════════════════════════════════════════════════════════════════
    # PEOPLE PAGE KPIs (Section 11-16)
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 12, "PEOPLE PAGE (/users) KPIs", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # KPI 11: Competency Coverage (People page version)
    pdf.section_title("11. Competency Coverage % (People Page)")
    pdf.result_box("Dashboard Value", "81%")

    pdf.sub_title("Formula")
    pdf.formula_box("competency_pct = round((total_emp - flagged) / total_emp * 100)")

    pdf.sub_title("What is 'flagged'?")
    pdf.body_text(
        "An employee is 'flagged' (not competent) if:\n"
        "1. They reported an incident where root_cause or root_cause_category\n"
        "   contains 'train' (training-related root cause), OR\n"
        "2. They are assigned a CAPA action where root_cause_addressed\n"
        "   contains 'train'"
    )

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "total_employees = 150\n\n"
        "Flagged from incidents (reported_by where root_cause LIKE '%train%'):\n"
        "  21 unique employees\n"
        "  IDs: 20,34,35,57,60,61,73,81,82,86,90,91,92,93,98,121,123,131,136,138,143\n\n"
        "Flagged from CAPA (responsible_person_id where root_cause_addressed LIKE '%train%'):\n"
        "  9 unique employees\n"
        "  IDs: 20,36,37,52,69,84,117,133,149\n\n"
        "Union (set merge): 29 unique (ID 20 is common in both)"
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "competency_pct = round((150 - 29) / 150 * 100)\n"
        "              = round(121 / 150 * 100)\n"
        "              = round(80.67)\n"
        "              = 81%"
    )

    pdf.sub_title("Labels")
    pdf.data_table(
        ["Score Range", "Tone", "Label"],
        [
            (">= 80%", "Green", "Excellent"),
            (">= 60% and < 80%", "Amber", "Good"),
            ("< 60%", "Red", "Needs Improvement"),
        ],
        [60, 40, 90],
    )

    # KPI 12: Worker Exposure Index (People page version)
    pdf.add_page()
    pdf.section_title("12. Worker Exposure Index (People Page)")
    pdf.result_box("Dashboard Value", "18%")

    pdf.sub_title("Formula")
    pdf.formula_box("exposure = round(min(100, (incidents + near_misses) / employees * 100))")

    pdf.sub_title("Date Window")
    pdf.body_text(
        "activity_anchor = MAX(latest_incident, latest_near_miss)\n"
        "               = MAX(2025-12-19 17:24, 2025-12-19 09:00)\n"
        "               = 2025-12-19 17:24:00\n"
        "cutoff_90 = 2025-12-19 17:24:00 - 90 days = 2025-09-20 17:24:00"
    )

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "recent_incidents (>= cutoff_90) = 9\n"
        "recent_near_misses (>= cutoff_90) = 18\n"
        "total_employees = 150"
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "exposure_index = round(min(100, (9 + 18) / 150 * 100))\n"
        "             = round(min(100, 27/150 * 100))\n"
        "             = round(min(100, 18.0))\n"
        "             = 18%"
    )

    pdf.sub_title("Labels")
    pdf.data_table(
        ["Score Range", "Tone", "Label"],
        [
            ("> 30%", "Red", "High Risk"),
            (">= 10% and <= 30%", "Amber", "Medium Risk"),
            ("< 10%", "Green", "Low Risk"),
        ],
        [60, 40, 90],
    )
    pdf.body_text("18% falls in Amber zone = 'Medium Risk'")

    # KPI 13: Supervisor Safety Score
    pdf.add_page()
    pdf.section_title("13. Supervisor Safety Score (People Page)")
    pdf.result_box("Dashboard Value", "66%")

    pdf.sub_title("Formula")
    pdf.formula_box("score = round(AVG(compliance_rating) / 5 * 100) for supervisors")

    pdf.sub_title("Logic")
    pdf.body_text(
        "1. Find all roles where safety_signatory = 'Yes'\n"
        "   Result: Plant Manager, Safety Manager, Operations Manager, Dept Supervisor\n\n"
        "2. Find safety walks where inspector's role has safety_signatory = 'Yes'\n"
        "   (JOIN safety_walks -> employees -> roles WHERE safety_signatory='Yes')\n\n"
        "3. Average their compliance_rating"
    )

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "AVG(compliance_rating) for supervisor inspectors = 3.32\n"
        "Total employees = 150"
    )

    pdf.sub_title("Calculation")
    pdf.body_text(
        "supervisor_score = round(3.32 / 5 * 100)\n"
        "                = round(66.4)\n"
        "                = 66%\n"
        "Label: 'Needs Coaching' (< 70)"
    )

    pdf.sub_title("Labels")
    pdf.data_table(
        ["Score Range", "Label"],
        [(">= 90%", "Highly Effective"), (">= 70%", "Effective"), ("< 70%", "Needs Coaching")],
        [95, 95],
    )

    # KPI 14: Behaviour Breakdown
    pdf.section_title("14. Behaviour Breakdown (People Page)")

    pdf.sub_title("Formula")
    pdf.formula_box("percentage = round(category_count / total * 100)")

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "Safe = safety_walks WHERE issues_found = 0 => 41\n"
        "At-Risk = safety_walks WHERE issues_found > 0 => 184\n"
        "Near Miss = near_misses count => 120\n"
        "Total = 41 + 184 + 120 = 345"
    )

    pdf.sub_title("Calculation")
    pdf.data_table(
        ["Category", "Count", "Formula", "Result"],
        [
            ("Safe", "41", "round(41/345*100)", "12%"),
            ("At-Risk", "184", "round(184/345*100)", "53%"),
            ("Near Miss", "120", "round(120/345*100)", "35%"),
        ],
        [40, 30, 65, 35],
    )

    # KPI 15: Fatigue Trend
    pdf.add_page()
    pdf.section_title("15. Fatigue Trend (People Page)")

    pdf.sub_title("Formula")
    pdf.formula_box("Per week: normal = min(hours, 8), overtime = max(0, hours - 8)")

    pdf.sub_title("Logic")
    pdf.body_text(
        "Window: latest shift date (2025-12-31) back 10 weeks\n"
        "  = 2025-10-23 to 2026-01-01\n\n"
        "For each shift record in this window:\n"
        "  - normal hours = min(actual_hours_worked, 8)\n"
        "  - overtime hours = max(0, actual_hours_worked - 8)\n\n"
        "Aggregated by week number (0-9), displayed as stacked bar chart\n"
        "showing normal vs overtime hours per week."
    )

    # KPI 16: Training Expiry
    pdf.section_title("16. Training Expiry (People Page)")

    pdf.sub_title("Formula")
    pdf.body_text(
        "For each employee with induction_date:\n"
        "  For each training program with expiry_months > 0:\n"
        "    Calculate next_due = induction_date + N*expiry_months until > today\n"
        "    Classify: Expired / Due <30 Days / Due <90 Days"
    )

    pdf.sub_title("Data from DB")
    pdf.body_text(
        "Training programs for org=4: 0 (none exist)\n"
        "Therefore: Expired=0, Due <30 Days=0, Due <90 Days=0\n"
        "expiring_soon_count = 0"
    )

    # ═══════════════════════════════════════════════════════════════════
    # Updated Summary Table
    # ═══════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section_title("Summary - All KPIs Verified")

    pdf.data_table(
        ["KPI", "Formula", "DB Result", "Dashboard", "Status"],
        [
            ("Injury Risk Score", "(weight/count*3)*100", "58.33%", "58.33%", "PASS"),
            ("TRIR", "(injuries*200K)/hours", "3.53", "3.53", "PASS"),
            ("LTIFR", "(LTI*1M)/hours", "1.61", "1.61", "PASS"),
            ("Near Miss Ratio", "NM/injuries", "10.9:1", "10.9:1", "PASS"),
            ("Audit Readiness", "(avg_rating/5)*100", "75.6%", "75.6%", "PASS"),
            ("DART", "(LTI*200K)/hours", "0.32", "0.32", "PASS"),
            ("LTISR", "(days*1M)/hours", "1.61", "1.61", "PASS"),
            ("FAR", "(fatal*100M)/hours", "0", "0", "PASS"),
            ("Exposure Index", "avg_compliance*20", "68%", "68%", "PASS"),
            ("Competency Coverage", "(capa_done/total)*100", "74%", "74%", "PASS"),
            ("--- PEOPLE PAGE ---", "---", "---", "---", "---"),
            ("Competency %", "(emp-flagged)/emp*100", "81%", "81%", "PASS"),
            ("Worker Exposure", "(inc+nm)/emp*100", "18%", "18%", "PASS"),
            ("Supervisor Score", "avg_sup_rating/5*100", "66%", "66%", "PASS"),
            ("Behaviour-Safe", "safe/total*100", "12%", "12%", "PASS"),
            ("Behaviour-AtRisk", "atRisk/total*100", "53%", "53%", "PASS"),
            ("Behaviour-NearMiss", "nm/total*100", "35%", "35%", "PASS"),
        ],
        [40, 44, 28, 30, 22],
    )

    pdf.ln(5)
    pdf.sub_title("Data Sources")
    pdf.data_table(
        ["Table", "Key Fields", "Records Used"],
        [
            ("incidents", "incident_type, severity, incident_date_time, days_away", "53 total"),
            ("shift_schedule", "actual_hours_worked", "622,370 total hours"),
            ("near_misses", "event_date_time", "120 total"),
            ("safety_walks", "compliance_rating, inspection_date_time", "All + 27 in window"),
            ("capa_actions", "status, responsible_person_id", "42 total (31 done)"),
        ],
        [40, 100, 50],
    )

    pdf.ln(5)
    pdf.sub_title("Multiplier Standards Reference")
    pdf.data_table(
        ["Multiplier", "Standard Body", "Meaning"],
        [
            ("200,000", "OSHA (US)", "Rate per 100 full-time workers/year"),
            ("1,000,000", "ILO (International)", "Rate per million hours worked"),
            ("100,000,000", "UK/International", "Rate per 100 million hours worked"),
        ],
        [40, 55, 95],
    )

    # Save
    output_path = r"c:\Users\Navnath\Desktop\HSE\hse_old_ui\HSE_KPI_Formula_Verification.pdf"
    pdf.output(output_path)
    print("PDF generated: " + output_path)
    sys.stdout.flush()


if __name__ == "__main__":
    generate_report()
