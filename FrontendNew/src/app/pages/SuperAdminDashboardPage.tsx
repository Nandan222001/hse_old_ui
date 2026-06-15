import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Mail,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  inviteOrganisation,
  listInvites,
  type OrganisationInvite,
} from "../../services/superadmin.service";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrganisationInvite["status"] }) {
  const map = {
    pending: { label: "Pending", icon: Clock, bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    accepted: { label: "Accepted", icon: CheckCircle2, bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7" },
    expired: { label: "Expired", icon: XCircle, bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  };
  const { label, icon: Icon, bg, color, border } = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={22} color={accent} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#0A0A0A" }}>{value}</p>
      </div>
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (invite: OrganisationInvite) => void;
}) {
  const [form, setForm] = useState({ organisation_name: "", admin_name: "", admin_email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organisation_name.trim() || !form.admin_name.trim() || !form.admin_email.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const invite = await inviteOrganisation(form);
      onSuccess(invite);
      setForm({ organisation_name: "", admin_name: "", admin_email: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invite. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            background: "linear-gradient(135deg,#0B3D91,#1D4ED8)",
            padding: "24px 28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>
                Invite Organisation
              </h2>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                Credentials will be sent to the admin email
              </p>
            </div>
          </div>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          {error && (
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
              <p style={{ margin: 0, color: "#991B1B", fontSize: 13 }}>{error}</p>
            </div>
          )}

          {[
            { name: "organisation_name", label: "Organisation Name", placeholder: "Acme Corp Ltd", type: "text" },
            { name: "admin_name", label: "Admin Full Name", placeholder: "Jane Smith", type: "text" },
            { name: "admin_email", label: "Admin Email Address", placeholder: "jane@acmecorp.com", type: "email" },
          ].map((field) => (
            <div key={field.name} style={{ marginBottom: 18 }}>
              <label
                htmlFor={field.name}
                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
              >
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#0A0A0A",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1D4ED8")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
              />
            </div>
          ))}

          <div
            style={{
              background: "#F0F4FF",
              border: "1px solid #C7D7FD",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "#1E40AF", lineHeight: 1.5 }}>
              <strong>What happens next:</strong> A temporary password will be auto-generated and
              sent to the admin email along with the login URL. The admin must change their
              password on first login.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                border: "1.5px solid #D1D5DB",
                borderRadius: 8,
                background: "#fff",
                color: "#374151",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                border: "none",
                borderRadius: 8,
                background: loading ? "#93C5FD" : "linear-gradient(135deg,#0B3D91,#1D4ED8)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Send size={15} />
              )}
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function SuperAdminDashboardPage() {
  const [invites, setInvites] = useState<OrganisationInvite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await listInvites();
      setInvites(data.items);
      setTotal(data.total);
    } catch {
      setFetchError("Failed to load invites. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleInviteSuccess = (newInvite: OrganisationInvite) => {
    setInvites((prev) => [newInvite, ...prev]);
    setTotal((t) => t + 1);
    setModalOpen(false);
    setSuccessMsg(
      `Invite sent to ${newInvite.admin_email} for ${newInvite.organisation_name}.`,
    );
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const pending = invites.filter((i) => i.status === "pending").length;
  const accepted = invites.filter((i) => i.status === "accepted").length;
  const expired = invites.filter((i) => i.status === "expired").length;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0A0A0A" }}>
            SuperAdmin Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
            Manage organisation onboarding and invite administrators
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchInvites}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              border: "1.5px solid #D1D5DB",
              borderRadius: 8,
              background: "#fff",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              border: "none",
              borderRadius: 8,
              background: "linear-gradient(135deg,#0B3D91,#1D4ED8)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(11,61,145,0.3)",
            }}
          >
            <Plus size={16} />
            Invite Organisation
          </button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#ECFDF5",
            border: "1px solid #6EE7B7",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <p style={{ margin: 0, color: "#065F46", fontSize: 14, fontWeight: 500 }}>{successMsg}</p>
        </div>
      )}

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="Total Invites" value={total} icon={Mail} accent="#1D4ED8" />
        <StatCard label="Pending" value={pending} icon={Clock} accent="#D97706" />
        <StatCard label="Accepted" value={accepted} icon={CheckCircle2} accent="#059669" />
        <StatCard label="Expired" value={expired} icon={XCircle} accent="#DC2626" />
      </div>

      {/* Invites table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color="#0B3D91" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0A" }}>
              Organisation Invites
            </span>
            <span
              style={{
                background: "#EEF2FF",
                color: "#3730A3",
                border: "1px solid #C7D2FE",
                borderRadius: 12,
                padding: "1px 8px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {total}
            </span>
          </div>
        </div>

        {/* Error state */}
        {fetchError && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <AlertCircle size={36} color="#EF4444" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, color: "#DC2626", fontSize: 14 }}>{fetchError}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && !fetchError && (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#9CA3AF" }}>
            <RefreshCw
              size={28}
              style={{ margin: "0 auto 12px", animation: "spin 1s linear infinite" }}
            />
            <p style={{ margin: 0, fontSize: 14 }}>Loading invites…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && invites.length === 0 && (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <Building2 size={48} color="#D1D5DB" style={{ margin: "0 auto 16px" }} />
            <p style={{ margin: "0 0 6px", color: "#374151", fontSize: 15, fontWeight: 600 }}>
              No invites yet
            </p>
            <p style={{ margin: "0 0 20px", color: "#9CA3AF", fontSize: 13 }}>
              Start by inviting your first organisation admin
            </p>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                border: "none",
                borderRadius: 8,
                background: "linear-gradient(135deg,#0B3D91,#1D4ED8)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={15} />
              Invite Organisation
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !fetchError && invites.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Organisation", "Admin Name", "Admin Email", "Status", "Invited On"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 20px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "1px solid #E5E7EB",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map((invite, idx) => (
                  <tr
                    key={invite.id}
                    style={{
                      background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F0F4FF")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA")
                    }
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: "linear-gradient(135deg,#0B3D91,#1D4ED8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {invite.organisation_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>
                          {invite.organisation_name}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{ padding: "14px 20px", fontSize: 14, color: "#374151" }}
                    >
                      {invite.admin_name}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: "#374151" }}>{invite.admin_email}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <StatusBadge status={invite.status} />
                    </td>
                    <td
                      style={{ padding: "14px 20px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}
                    >
                      {new Date(invite.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite modal */}
      <InviteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      {/* CSS for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
