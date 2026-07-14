import { useEffect, useState } from "react";
import { RefreshCw, Plus, CheckCircle, AlertTriangle, Clock, Shield, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  type IncidentListItem, type WorkflowStats, type WorkerReportPayload,
  type InvestigatePayload, type CloseIncidentPayload,
  getWorkflowStats, getMyReports, getPendingReview, getManagerQueue,
  workerReportIncident, acknowledgeIncident, investigateIncident,
  escalateIncident, approveInvestigation, closeIncident,
} from "../../services/incident-workflow.service";

const WORKER_ROLES = new Set(["worker", "employee", "operator", "technician"]);
const SUPERVISOR_ROLES = new Set(["supervisor", "site inspector", "safety manager", "site engineer"]);
const MANAGER_ROLES = new Set(["manager", "hse manager", "admin", "director"]);

const STATUS_COLORS: Record<string, string> = {
  reported: "bg-yellow-100 text-yellow-700",
  acknowledged: "bg-blue-100 text-blue-700",
  under_investigation: "bg-purple-100 text-purple-700",
  escalated: "bg-orange-100 text-orange-700",
  pending_approval: "bg-indigo-100 text-indigo-700",
  closed: "bg-green-100 text-green-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  Minor: "bg-green-100 text-green-700",
  Moderate: "bg-yellow-100 text-yellow-700",
  Serious: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const INCIDENT_TYPES = ["Injury", "Near Miss", "Unsafe Act", "Unsafe Condition", "Property Damage", "Environmental Spill"];
const SEVERITY_OPTIONS = ["Minor", "Moderate", "Serious", "Critical"];
const CLASSIFICATION_OPTIONS = ["LTI", "MTI", "First Aid", "Near Miss"];

type RoleTier = "worker" | "supervisor" | "manager";

function getRoleTier(role: string): RoleTier {
  const r = (role || "").toLowerCase().trim();
  if (MANAGER_ROLES.has(r)) return "manager";
  if (SUPERVISOR_ROLES.has(r)) return "supervisor";
  return "worker";
}

function WorkerReportForm({ onSubmit, onCancel }: { onSubmit: (p: WorkerReportPayload) => void; onCancel: () => void }) {
  const [form, setForm] = useState<WorkerReportPayload>({
    incident_date_time: new Date().toISOString().slice(0, 16),
    incident_type: "", severity: "", description: "",
    anyone_injured: "No", hazard_still_present: "No",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.incident_type || !form.severity || !form.description) return;
    onSubmit({ ...form, incident_date_time: new Date(form.incident_date_time).toISOString() });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Report New Incident</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date & Time *</label>
              <input type="datetime-local" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.incident_date_time} onChange={e => setForm(f => ({ ...f, incident_date_time: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.incident_type} onChange={e => setForm(f => ({ ...f, incident_type: e.target.value }))}>
                <option value="">Select type...</option>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Severity *</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                <option value="">Select severity...</option>
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Anyone Injured?</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.anyone_injured} onChange={e => setForm(f => ({ ...f, anyone_injured: e.target.value }))}>
                <option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>
          </div>
          {form.anyone_injured === "Yes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Injured Person Name</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.injured_person_name || ""} onChange={e => setForm(f => ({ ...f, injured_person_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Injured Body Part</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.injured_body_part || ""} onChange={e => setForm(f => ({ ...f, injured_body_part: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Description *</label>
            <textarea className="w-full mt-1 px-3 py-2 border rounded-md text-sm" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What happened?" />
          </div>
          <div>
            <label className="text-sm font-medium">Hazard Still Present?</label>
            <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.hazard_still_present} onChange={e => setForm(f => ({ ...f, hazard_still_present: e.target.value }))}>
              <option value="No">No</option><option value="Yes">Yes</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Submit Report</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function InvestigationForm({ incidentId, onDone, onCancel }: { incidentId: number; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<InvestigatePayload>({ root_cause: "", severity_classification: "", immediate_actions_taken: "", escalate: false, escalation_reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.root_cause || !form.severity_classification) return;
    setSubmitting(true);
    try { await investigateIncident(incidentId, form); onDone(); } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader><CardTitle className="flex items-center justify-between"><span>Investigation — Incident #{incidentId}</span><button onClick={onCancel}><X className="w-5 h-5" /></button></CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium">Root Cause (5-Why) *</label><textarea className="w-full mt-1 px-3 py-2 border rounded-md text-sm" rows={2} value={form.root_cause} onChange={e => setForm(f => ({ ...f, root_cause: e.target.value }))} /></div>
            <div><label className="text-sm font-medium">Severity Classification *</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.severity_classification} onChange={e => setForm(f => ({ ...f, severity_classification: e.target.value }))}>
                <option value="">Select...</option>{CLASSIFICATION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium">Immediate Actions Taken</label><textarea className="w-full mt-1 px-3 py-2 border rounded-md text-sm" rows={2} value={form.immediate_actions_taken || ""} onChange={e => setForm(f => ({ ...f, immediate_actions_taken: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="escalate" checked={form.escalate} onChange={e => setForm(f => ({ ...f, escalate: e.target.checked }))} /><label htmlFor="escalate" className="text-sm font-medium">Escalate to Manager?</label></div>
            {form.escalate && <div><label className="text-sm font-medium">Escalation Reason</label><input type="text" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.escalation_reason || ""} onChange={e => setForm(f => ({ ...f, escalation_reason: e.target.value }))} /></div>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">{submitting ? "Submitting..." : "Submit Investigation"}</Button>
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CloseIncidentForm({ incidentId, onDone, onCancel }: { incidentId: number; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<CloseIncidentPayload>({ closure_notes: "", regulatory_notified: "No", lessons_learned: "", communicated_to_teams: "No" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try { await closeIncident(incidentId, form); onDone(); } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader><CardTitle className="flex items-center justify-between"><span>Close Incident #{incidentId}</span><button onClick={onCancel}><X className="w-5 h-5" /></button></CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium">Closure Notes</label><textarea className="w-full mt-1 px-3 py-2 border rounded-md text-sm" rows={2} value={form.closure_notes || ""} onChange={e => setForm(f => ({ ...f, closure_notes: e.target.value }))} /></div>
            <div><label className="text-sm font-medium">Regulatory Notified?</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.regulatory_notified} onChange={e => setForm(f => ({ ...f, regulatory_notified: e.target.value }))}><option value="No">No</option><option value="Yes">Yes</option></select>
            </div>
            <div><label className="text-sm font-medium">Lessons Learned</label><textarea className="w-full mt-1 px-3 py-2 border rounded-md text-sm" rows={2} value={form.lessons_learned || ""} onChange={e => setForm(f => ({ ...f, lessons_learned: e.target.value }))} /></div>
            <div><label className="text-sm font-medium">Communicated to Teams?</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm" value={form.communicated_to_teams} onChange={e => setForm(f => ({ ...f, communicated_to_teams: e.target.value }))}><option value="No">No</option><option value="Yes">Yes</option></select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">{submitting ? "Closing..." : "Close Incident"}</Button>
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function IncidentTable({ incidents, roleTier, onAcknowledge, onInvestigate, onEscalate, onApprove, onClose }: {
  incidents: IncidentListItem[]; roleTier: RoleTier;
  onAcknowledge: (id: number) => void; onInvestigate: (id: number) => void;
  onEscalate: (id: number) => void; onApprove: (id: number, d: "approved"|"rejected") => void;
  onClose: (id: number) => void;
}) {
  if (incidents.length === 0) return <div className="p-6 text-center text-sm text-muted-foreground">No incidents found.</div>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Severity</TableHead>
          <TableHead>Status</TableHead><TableHead>Description</TableHead><TableHead>Reported</TableHead><TableHead>Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {incidents.map(inc => (
            <TableRow key={inc.id}>
              <TableCell className="font-mono text-xs">#{inc.id}</TableCell>
              <TableCell className="text-sm">{inc.incident_type || "—"}</TableCell>
              <TableCell><Badge className={`text-xs ${SEVERITY_COLORS[inc.severity || ""] || ""}`} variant="outline">{inc.severity || "—"}</Badge></TableCell>
              <TableCell><Badge className={`text-xs ${STATUS_COLORS[inc.workflow_status || ""] || ""}`} variant="outline">{(inc.workflow_status || "—").replace(/_/g, " ")}</Badge></TableCell>
              <TableCell className="max-w-[200px] truncate text-sm" title={inc.description || ""}>{inc.description || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{inc.reported_at ? new Date(inc.reported_at).toLocaleDateString() : "—"}</TableCell>
              <TableCell className="space-x-1">
                {roleTier !== "worker" && inc.workflow_status === "reported" && <Button size="sm" variant="outline" className="text-xs" onClick={() => onAcknowledge(inc.id)}>Acknowledge</Button>}
                {roleTier !== "worker" && ["acknowledged","under_investigation"].includes(inc.workflow_status || "") && <Button size="sm" variant="outline" className="text-xs" onClick={() => onInvestigate(inc.id)}>Investigate</Button>}
                {roleTier !== "worker" && !["closed","escalated"].includes(inc.workflow_status || "") && <Button size="sm" variant="outline" className="text-xs text-orange-600" onClick={() => onEscalate(inc.id)}>Escalate</Button>}
                {roleTier === "manager" && ["pending_approval","escalated"].includes(inc.workflow_status || "") && <><Button size="sm" variant="outline" className="text-xs text-green-600" onClick={() => onApprove(inc.id, "approved")}>Approve</Button><Button size="sm" variant="outline" className="text-xs text-red-600" onClick={() => onApprove(inc.id, "rejected")}>Reject</Button></>}
                {roleTier === "manager" && inc.workflow_status !== "closed" && <Button size="sm" variant="outline" className="text-xs text-green-700" onClick={() => onClose(inc.id)}>Close</Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function IncidentReportingPage() {
  const { user } = useAuth();
  const roleTier = getRoleTier(user?.role || "");
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [investigatingId, setInvestigatingId] = useState<number | null>(null);
  const [closingId, setClosingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [s, i] = await Promise.all([
        getWorkflowStats(),
        roleTier === "worker" ? getMyReports() : roleTier === "supervisor" ? getPendingReview() : getManagerQueue(),
      ]);
      setStats(s); setIncidents(i);
    } catch { setError("Failed to load incident data."); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReport = async (p: WorkerReportPayload) => { try { await workerReportIncident(p); setShowReportForm(false); fetchData(); } catch { setError("Failed to submit."); } };
  const handleAcknowledge = async (id: number) => { try { await acknowledgeIncident(id); fetchData(); } catch { setError("Failed."); } };
  const handleEscalate = async (id: number) => { const r = prompt("Escalation reason:"); if (!r) return; try { await escalateIncident(id, r); fetchData(); } catch { setError("Failed."); } };
  const handleApprove = async (id: number, d: "approved"|"rejected") => { try { await approveInvestigation(id, d); fetchData(); } catch { setError("Failed."); } };

  const roleLabel = roleTier === "worker" ? "Worker" : roleTier === "supervisor" ? "Supervisor" : "Manager";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incident Reporting</h1>
          <p className="text-sm text-muted-foreground mt-1">Role: <Badge variant="outline" className="ml-1">{roleLabel}</Badge></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
          {roleTier !== "manager" && <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowReportForm(true)}><Plus className="w-4 h-4 mr-2" /> Report Incident</Button>}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { l: "Reported", v: stats.reported, I: AlertTriangle, c: "text-yellow-600" },
            { l: "Acknowledged", v: stats.acknowledged, I: CheckCircle, c: "text-blue-600" },
            { l: "Investigating", v: stats.under_investigation, I: Clock, c: "text-purple-600" },
            { l: "Escalated", v: stats.escalated, I: AlertTriangle, c: "text-orange-600" },
            { l: "Pending", v: stats.pending_approval, I: Shield, c: "text-indigo-600" },
            { l: "Closed", v: stats.closed, I: CheckCircle, c: "text-green-600" },
          ].map(({ l, v, I: Icon, c }) => (
            <Card key={l}><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${c}`} /><p className="text-xs text-muted-foreground">{l}</p></div><p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p></CardContent></Card>
          ))}
        </div>
      )}

      {showReportForm && <WorkerReportForm onSubmit={handleReport} onCancel={() => setShowReportForm(false)} />}
      {investigatingId !== null && <InvestigationForm incidentId={investigatingId} onDone={() => { setInvestigatingId(null); fetchData(); }} onCancel={() => setInvestigatingId(null)} />}
      {closingId !== null && <CloseIncidentForm incidentId={closingId} onDone={() => { setClosingId(null); fetchData(); }} onCancel={() => setClosingId(null)} />}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" />{roleTier === "worker" ? "My Reports" : roleTier === "supervisor" ? "Pending Review" : "Manager Queue"} ({incidents.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {error ? <div className="p-6 text-center text-sm text-red-500">{error}</div>
            : loading ? <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
            : <IncidentTable incidents={incidents} roleTier={roleTier} onAcknowledge={handleAcknowledge} onInvestigate={id => setInvestigatingId(id)} onEscalate={handleEscalate} onApprove={handleApprove} onClose={id => setClosingId(id)} />}
        </CardContent>
      </Card>
    </div>
  );
}
