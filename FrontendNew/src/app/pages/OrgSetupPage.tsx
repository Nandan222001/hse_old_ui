import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
  Users,
  MapPin,
  ShieldCheck,
  ClipboardList,
  Activity,
  BarChart3,
} from "lucide-react";
import { uploadOrganisationExcel, type UploadResult } from "../../services/organisation-setup.service";

// ── Sheet display map ─────────────────────────────────────────────────────────
const SHEET_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  organisation:       { label: "Organisation",       icon: Building2,     color: "#1D4ED8" },
  sites:              { label: "Sites",               icon: MapPin,        color: "#0891B2" },
  departments:        { label: "Departments",         icon: Building2,     color: "#7C3AED" },
  dept_managers:      { label: "Dept. Managers",      icon: Users,         color: "#7C3AED" },
  working_stations:   { label: "Working Stations",    icon: MapPin,        color: "#059669" },
  roles:              { label: "Roles",               icon: ShieldCheck,   color: "#D97706" },
  employees:          { label: "Employees",           icon: Users,         color: "#DC2626" },
  policies:           { label: "Policies",            icon: ClipboardList, color: "#2563EB" },
  permit_types:       { label: "Permit Types",        icon: ClipboardList, color: "#9333EA" },
  training_programs:  { label: "Training Programs",   icon: ShieldCheck,   color: "#0D9488" },
  hazard_categories:  { label: "Hazard Categories",   icon: AlertCircle,   color: "#EA580C" },
  hazards:            { label: "Hazards",             icon: AlertCircle,   color: "#B91C1C" },
  permits_to_work:    { label: "Permits to Work",     icon: ClipboardList, color: "#4F46E5" },
  incidents:          { label: "Incidents",           icon: Activity,      color: "#DC2626" },
  near_misses:        { label: "Near Misses",         icon: Activity,      color: "#D97706" },
  safety_walks:       { label: "Safety Walks",        icon: ShieldCheck,   color: "#16A34A" },
  capa_actions:       { label: "CAPA Actions",        icon: ClipboardList, color: "#7C3AED" },
  shift_schedule:     { label: "Shift Schedule",      icon: BarChart3,     color: "#0369A1" },
};

type Step = "upload" | "processing" | "done" | "error";

export function OrgSetupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("");
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hse_user");
      const u = raw ? JSON.parse(raw) : null;
      if (u?.email) setAdminEmail(u.email);
      if (u?.orgName) setOrgName(u.orgName);
    } catch {
      // ignore
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setErrorMsg("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("File must be under 50 MB");
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setStep("processing");
    setUploadPct(0);
    setErrorMsg(null);

    try {
      const res = await uploadOrganisationExcel(
        adminEmail,
        selectedFile,
        (pct) => setUploadPct(pct),
      );
      setResult(res);
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  const goToDashboard = () => {
    navigate("/", { replace: true });
  };

  const retry = () => {
    setStep("upload");
    setSelectedFile(null);
    setErrorMsg(null);
    setUploadPct(0);
    setResult(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F0F4FF 0%, #E8F0FE 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* Logo bar */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "linear-gradient(135deg, #0B3D91, #1D4ED8)",
            borderRadius: 12,
            marginBottom: 8,
          }}
        >
          <ShieldCheck size={22} color="#fff" />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>HSE Intelligence</span>
        </div>
        {orgName && (
          <p style={{ margin: 0, color: "#6B7280", fontSize: 13 }}>
            Setting up <strong style={{ color: "#0B3D91" }}>{orgName}</strong>
          </p>
        )}
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: step === "done" ? 720 : 560,
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          overflow: "hidden",
          transition: "max-width 0.4s ease",
        }}
      >
        {/* ── UPLOAD STEP ── */}
        {(step === "upload" || step === "error") && (
          <div style={{ padding: "36px 36px 32px" }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#0A0A0A" }}>
                Organisation Data Setup
              </h1>
              <p style={{ margin: 0, color: "#6B7280", fontSize: 14, lineHeight: 1.6 }}>
                Upload the HSE Intelligence Excel workbook to import your organisation's
                sites, employees, permits, incidents, and all other data in one step.
              </p>
            </div>

            {/* What's included info */}
            <div
              style={{
                background: "#F0F4FF",
                border: "1px solid #C7D7FD",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 24,
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Excel must contain these 17 sheets
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                {["Organisation", "Sites", "Departments", "Working Stations", "Roles",
                  "Employees", "Policies", "Permit Types", "Hazard Categories", "Hazards",
                  "Training Programs", "Permits To Work", "Incidents", "Near Misses",
                  "Safety Walks", "CAPA Actions", "Shift Schedule"].map((s) => (
                  <span key={s} style={{ fontSize: 12, color: "#374151" }}>• {s}</span>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#1D4ED8" : selectedFile ? "#059669" : "#D1D5DB"}`,
                borderRadius: 12,
                background: dragging ? "#EEF2FF" : selectedFile ? "#F0FDF4" : "#FAFAFA",
                padding: "32px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: errorMsg ? 16 : 24,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {selectedFile ? (
                <div>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <FileSpreadsheet size={26} color="#16A34A" />
                  </div>
                  <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#0A0A0A", fontSize: 15 }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ margin: 0, color: "#6B7280", fontSize: 13 }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — ready to upload
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setErrorMsg(null); }}
                    style={{
                      marginTop: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      border: "1px solid #FECACA",
                      borderRadius: 6,
                      background: "#FEF2F2",
                      color: "#DC2626",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: "#EEF2FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <Upload size={24} color="#1D4ED8" />
                  </div>
                  <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#374151", fontSize: 15 }}>
                    Drag & drop your Excel file here
                  </p>
                  <p style={{ margin: 0, color: "#9CA3AF", fontSize: 13 }}>
                    or click to browse — .xlsx / .xls, max 50 MB
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {errorMsg && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, color: "#991B1B", fontSize: 13 }}>{errorMsg}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px 20px",
                border: "none",
                borderRadius: 10,
                background: selectedFile
                  ? "linear-gradient(135deg, #0B3D91, #1D4ED8)"
                  : "#E5E7EB",
                color: selectedFile ? "#fff" : "#9CA3AF",
                fontSize: 15,
                fontWeight: 700,
                cursor: selectedFile ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                boxShadow: selectedFile ? "0 4px 14px rgba(11,61,145,0.3)" : "none",
              }}
            >
              <Upload size={18} />
              Import Organisation Data
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── PROCESSING STEP ── */}
        {step === "processing" && (
          <div style={{ padding: "48px 36px", textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <Loader2
                size={36}
                color="#1D4ED8"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#0A0A0A" }}>
              Importing your data…
            </h2>
            <p style={{ margin: "0 0 28px", color: "#6B7280", fontSize: 14 }}>
              This may take a minute for large datasets (shifts, permits).
            </p>

            {/* Progress bar */}
            <div
              style={{
                background: "#F3F4F6",
                borderRadius: 8,
                overflow: "hidden",
                height: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${uploadPct}%`,
                  background: "linear-gradient(90deg, #0B3D91, #1D4ED8)",
                  transition: "width 0.3s ease",
                  borderRadius: 8,
                }}
              />
            </div>
            <p style={{ margin: 0, color: "#9CA3AF", fontSize: 13 }}>
              {uploadPct < 100 ? `Uploading… ${uploadPct}%` : "Processing sheets…"}
            </p>
          </div>
        )}

        {/* ── DONE STEP ── */}
        {step === "done" && result && (
          <div>
            {/* Success header */}
            <div
              style={{
                background: "linear-gradient(135deg, #065F46, #059669)",
                padding: "28px 32px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={28} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>
                  Setup Complete!
                </h2>
                <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                  {result.message}
                </p>
              </div>
            </div>

            {/* Sheet results grid */}
            <div style={{ padding: "24px 28px 28px" }}>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Import Summary
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                {Object.entries(result.sheets).map(([key, count]) => {
                  const meta = SHEET_META[key];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={key}
                      style={{
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${meta.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} color={meta.color} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: "#6B7280", fontWeight: 500 }}>
                          {meta.label}
                        </p>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0A0A0A" }}>
                          {count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={goToDashboard}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "13px 20px",
                  border: "none",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #0B3D91, #1D4ED8)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(11,61,145,0.3)",
                }}
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR STEP (handled in upload step above) ── */}
        {step === "error" && !errorMsg && (
          <div style={{ padding: "36px", textAlign: "center" }}>
            <AlertCircle size={48} color="#DC2626" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ margin: "0 0 8px", color: "#0A0A0A", fontSize: 18 }}>Import Failed</h2>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14 }}>
              Something went wrong while importing your data.
            </p>
            <button
              type="button"
              onClick={retry}
              style={{
                padding: "11px 24px",
                border: "none",
                borderRadius: 8,
                background: "linear-gradient(135deg, #0B3D91, #1D4ED8)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
