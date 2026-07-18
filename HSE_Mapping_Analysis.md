# 📊 HSE Checklist Design Analysis — Based on HSE_Import_Template.xlsx

Maine `HSE_Import_Template.xlsx` ke all 18 sheets (specifically **Hazards, Equipment_Certifications, Incidents, Near_Misses, aur Permits_To_Work**) ko detailed me study kiya hai. 

Is master data me jo **actual incidents, near-misses, and equipment categories** record ho rakhi hain, unhe block karne ke liye **4 roles ke checklists me kya-kya checkpoints hone chahiye**, uski details niche mapped hain.

---

## 👷 1. WORKER CHECKLIST
*Worker ka checklist direct action-oriented aur field hazard levels ko check karne ke liye hona chahiye (taaki past incidents repeat na hon).*

### 🔗 Direct Mapping to Past Incidents & Near-Misses:
* **Burn Injury (INC001)**: Welder ko FR sleeve na wear karne ki wajah se burn hua.
  * *Worker Checkpoint*: "Are flame-retardant (FR) sleeves and welding PPE complete and undamaged?"
* **Chemical Splash (INC004)**: Operator ke chemical glove me hole hone ki wajah se hand burn hua.
  * *Worker Checkpoint*: "Perform visual and air-test check on chemical gloves to ensure no pinholes before decanting."
* **Grinding Disc Shatter (INC005 & NM008)**: Defective/cracked grinding disc blast hui.
  * *Worker Checkpoint*: "Check grinding disc face for hairline cracks or chipping before mounting on tool."
* **Fall from Scaffold (INC006)**: Scaffold se girte time lanyard anchor point par connected nahi tha.
  * *Worker Checkpoint*: "Confirm safety harness lanyard is securely clipped/tied off to a load-bearing anchor point."
* **Spill Slip (INC008)**: Walkway par oil spillage ki wajah se worker slip ho gaya.
  * *Worker Checkpoint*: "Ensure your immediate work area and floor are dry and free of oil/liquid spills."
* **Trip Hazard (NM001)**: Welding rod walkway par chhuti, worker slip hone laga.
  * *Worker Checkpoint (End-of-Shift)*: "All tools, consumables (welding rods, scrap wires) cleared from walkways and stored."
* **Chemical Valve Open (NM002)**: Chemical decanting valve open reh gaya tha.
  * *Worker Checkpoint (End-of-Shift)*: "Verify all chemical storage valves, nozzles, and containers are tightly sealed."

---

## 👔 2. SUPERVISOR CHECKLIST
*Supervisor ka checklist control, physical barriers aur work permission execution par focused hona chahiye.*

### 🔗 Direct Mapping to Past Incidents & Near-Misses:
* **Arc Flash Permit Violation (INC007)**: Electrical panel maintenance bina PTW aur LOTO block kiye start kar di gayi thi.
  * *Supervisor Checkpoint*: "Confirm that Lock-Out/Tag-Out (LOTO) is physically applied and Permit to Work is approved before releasing electrical work."
* **Loose Conveyor Guard (NM003)**: Conveyor belt ka side guard rail loose paya gaya.
  * *Supervisor Checkpoint*: "Verify all moving parts, belt drives, and rotating components have secure machine guards installed."
* **Cracked Scaffold Board (NM004)**: Height work ke time worker ke weight se scaffold board crack ho gaya.
  * *Supervisor Checkpoint*: "Perform pre-task inspection of scaffold boards, couplers, and check that scaffolding has a valid 'Green Tag'."
* **Forklift Pedestrian Hazard (NM007)**: Pedestrian crossway marked na hone se forklift collision hone laga.
  * *Supervisor Checkpoint*: "Verify pedestrian walkways are clearly demarcated with barrier ropes or paint, and forklift operations are restricted to vehicle lanes."
* **Manual Lifting Strain (INC002)**: Two workers strained their backs lifting heavy weight without mechanical aid.
  * *Supervisor Checkpoint*: "Conduct toolbox talk briefing on safe manual handling limits (>15kg requires mechanical aids or team lifts)."

---

## 🔍 3. AUDITOR CHECKLIST
*Auditor ka checklist independent compliance review, safety equipment certifications, calibration, and site standards checking par focus hona chahiye.*

### 🔗 Direct Mapping to Equipment Certifications:
* **Welding Equipment Safety (CERT001)**:
  * *Auditor Checkpoint*: "Verify PAT (Portable Appliance Test) stickers and certification validity (BS EN 60974-1) on all active MIG Welder units."
* **Lifting Equipment Compliance (CERT002 & CERT003)**:
  * *Auditor Checkpoint*: "Check that Overhead Cranes and Forklifts (FLTs) have valid LOLER 1998 thorough examination certificates (valid within 6 months)."
* **Boiler Pressure Safety (CERT004 & INC003)**: Boiler PRV relief discharge incident hua tha due to missed maintenance.
  * *Auditor Checkpoint*: "Review PSSR 2000 Written Scheme of Examination certificates and check that boiler relief valves are tested and certified."
* **Electrical Safety Audit (CERT005 & INC007)**:
  * *Auditor Checkpoint*: "Verify Fixed Wiring Inspection records (BS 7671) for distribution boards and check that electrical rooms are locked."
* **Gas Detection & Fire Safety (CERT008 & CERT009)**:
  * *Auditor Checkpoint*: "Ensure gas detectors in Boiler Room are calibrated (BS EN 45544) and fire extinguishers are tagged (BS 5306-3)."

---

## 🏢 4. MANAGER CHECKLIST
*Manager ka checklist compliance dashboards, training records audits, legal standards, aur CAPA actions execution tracking par focus karega.*

### 🔗 Direct Mapping to CAPA & System Compliance:
* **CAPA Overdue tracking (CAPA001 - CAPA007)**: Action plans verification.
  * *Manager Checkpoint*: "Verify that CAPA actions raised for past incidents (like FR sleeves enforcement, monthly boiler servicing) are closed within SLA."
* **Training Gaps (INC002, INC006)**: Training refreshers.
  * *Manager Checkpoint*: "Perform audit of site training records — ensure 100% compliance for high-risk modules (Working at Height, Chemical Handling, LOTO)."
* **Insurance & Regulatory Compliance (INC001, INC004, INC006)**: Lost time injuries logs.
  * *Manager Checkpoint*: "Track Days Away from Work (LTIs) metrics and ensure regulatory reports for lost-time cases (e.g. 5 days for chemical burns, 8 days for scaffold falls) are filed."
* **Permit-to-Work Compliance Review**:
  * *Manager Checkpoint*: "Audit Permit to Work logs against active field tasks to ensure no high-risk job (Hot work, Confined space, WAH) is running without approved authorization."
