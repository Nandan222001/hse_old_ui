import { useEffect, useState } from "react";
import { FileCheck, RefreshCw, AlertTriangle, Plus, Trash2, X } from "lucide-react";
import {
  getEquipmentCertifications, createEquipmentCertification, deleteEquipmentCertification,
  type EquipmentCertification, type EquipmentCertFilters, type CertCreate,
} from "../../services/analytics.service";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const STATUS_COLORS: Record<string, string> = {
  Valid:           "bg-blue-100 text-blue-700",
  "Expiring Soon": "bg-yellow-100 text-yellow-700",
  Expired:         "bg-red-100 text-red-700",
};

const EMPTY_FORM: CertCreate = {
  equipment_name: "", equipment_type: "", zone: "",
  serial_number: "", manufacturer: "", model: "",
  certification_type: "", certified_by: "",
  issue_date: "", expiry_date: "", next_inspection_date: "",
  compliance_standard: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold" style={{ color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

export function EquipmentCertificationPage() {
  const [records, setRecords]   = useState<EquipmentCertification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filters, setFilters]   = useState<EquipmentCertFilters>({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState<CertCreate>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEquipmentCertifications(filters);
      setRecords(data);
    } catch {
      setError("Failed to load equipment certifications. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const stats = {
    total:        records.length,
    valid:        records.filter(r => r.Status === "Valid").length,
    expiringSoon: records.filter(r => r.Status === "Expiring Soon").length,
    expired:      records.filter(r => r.Status === "Expired").length,
  };

  const equipmentTypes = [...new Set(records.map(r => r.Equipment_Type).filter(Boolean))];

  const handleSave = async () => {
    if (!form.equipment_name.trim()) { setFormError("Equipment name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload: CertCreate = {
        ...form,
        issue_date:           form.issue_date || undefined,
        expiry_date:          form.expiry_date || undefined,
        next_inspection_date: form.next_inspection_date || undefined,
      };
      await createEquipmentCertification(payload);
      setShowModal(false);
      setForm(EMPTY_FORM);
      await fetchData();
    } catch {
      setFormError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (certId: string) => {
    if (!window.confirm(`Delete ${certId}?`)) return;
    try {
      await deleteEquipmentCertification(certId);
      setRecords(prev => prev.filter(r => r.Cert_ID !== certId));
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipment Certification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track equipment certifications and inspection records.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setFormError(""); setShowModal(true); }}
            style={{ background: "linear-gradient(135deg,#0B3D91,#1D4ED8)", color: "#fff" }}>
            <Plus className="w-4 h-4 mr-2" /> Add Certificate
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Equipment", value: stats.total,        color: "text-gray-900" },
          { label: "Valid",           value: stats.valid,        color: "text-blue-600" },
          { label: "Expiring Soon",   value: stats.expiringSoon, color: "text-yellow-600" },
          { label: "Expired",         value: stats.expired,      color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert banner */}
      {(stats.expired > 0 || stats.expiringSoon > 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            {stats.expired > 0 && <span className="font-semibold">{stats.expired} expired</span>}
            {stats.expired > 0 && stats.expiringSoon > 0 && " and "}
            {stats.expiringSoon > 0 && <span className="font-semibold">{stats.expiringSoon} expiring soon</span>}
            {" "}— review and schedule recertification.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.status ?? "all"}
          onValueChange={v => setFilters(f => ({ ...f, status: v === "all" ? undefined : v }))}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Valid", "Expiring Soon", "Expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.equipment_type ?? "all"}
          onValueChange={v => setFilters(f => ({ ...f, equipment_type: v === "all" ? undefined : v }))}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Equipment Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {equipmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Certifications ({records.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center text-sm text-red-500">{error}</div>
          ) : loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center">
              <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-20 text-blue-400" />
              <p className="text-sm text-muted-foreground mb-3">No certifications yet. Add your first one.</p>
              <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setFormError(""); setShowModal(true); }}
                style={{ background: "linear-gradient(135deg,#0B3D91,#1D4ED8)", color: "#fff" }}>
                <Plus className="w-4 h-4 mr-2" /> Add Certificate
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cert ID</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Site / Zone</TableHead>
                    <TableHead>Serial No.</TableHead>
                    <TableHead>Cert Type</TableHead>
                    <TableHead>Certified By</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Next Inspection</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Standard</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.Cert_ID}
                      className={r.Status === "Expired" ? "bg-red-50" : r.Status === "Expiring Soon" ? "bg-yellow-50" : ""}>
                      <TableCell className="font-mono text-xs">{r.Cert_ID}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{r.Equipment_Name}</p>
                        <p className="text-xs text-muted-foreground">{r.Manufacturer} {r.Model}</p>
                      </TableCell>
                      <TableCell className="text-sm">{r.Equipment_Type}</TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{r.Site_ID}</span>
                        <span className="text-muted-foreground"> / {r.Zone_ID}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.Serial_Number}</TableCell>
                      <TableCell className="text-sm">{r.Certification_Type}</TableCell>
                      <TableCell className="text-sm">{r.Certified_By}</TableCell>
                      <TableCell className="text-sm">{r.Expiry_Date}</TableCell>
                      <TableCell className="text-sm">{r.Next_Inspection}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[r.Status] ?? ""}`} variant="outline">
                          {r.Status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.Compliance_Standard}</TableCell>
                      <TableCell>
                        <button onClick={() => handleDelete(r.Cert_ID)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Certificate Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => !saving && setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              style={{ border: "1px solid #D6E4FF" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E0EAFF" }}>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-[17px] font-bold" style={{ color: "#0A0A0A" }}>Add Equipment Certificate</h2>
                </div>
                <button disabled={saving} onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formError && (
                  <div className="col-span-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <Field label="Equipment Name *">
                  <input value={form.equipment_name} onChange={e => setForm(f => ({ ...f, equipment_name: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="e.g. Overhead Crane #3" />
                </Field>
                <Field label="Equipment Type">
                  <input value={form.equipment_type ?? ""} onChange={e => setForm(f => ({ ...f, equipment_type: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="e.g. Lifting Equipment" />
                </Field>
                <Field label="Serial Number">
                  <input value={form.serial_number ?? ""} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="SN-00123" />
                </Field>
                <Field label="Manufacturer">
                  <input value={form.manufacturer ?? ""} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="Manufacturer name" />
                </Field>
                <Field label="Model">
                  <input value={form.model ?? ""} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="Model number" />
                </Field>
                <Field label="Zone / Area">
                  <input value={form.zone ?? ""} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="Zone A" />
                </Field>
                <Field label="Certification Type">
                  <input value={form.certification_type ?? ""} onChange={e => setForm(f => ({ ...f, certification_type: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="e.g. Annual Inspection" />
                </Field>
                <Field label="Certified By">
                  <input value={form.certified_by ?? ""} onChange={e => setForm(f => ({ ...f, certified_by: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="Inspector or certifying body" />
                </Field>
                <Field label="Issue Date">
                  <input type="date" value={form.issue_date ?? ""} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }} />
                </Field>
                <Field label="Expiry Date">
                  <input type="date" value={form.expiry_date ?? ""} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }} />
                </Field>
                <Field label="Next Inspection Date">
                  <input type="date" value={form.next_inspection_date ?? ""} onChange={e => setForm(f => ({ ...f, next_inspection_date: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }} />
                </Field>
                <Field label="Compliance Standard">
                  <input value={form.compliance_standard ?? ""} onChange={e => setForm(f => ({ ...f, compliance_standard: e.target.value }))}
                    className="h-9 rounded-lg border px-3 text-[13px]" style={{ borderColor: "#D1D5DB" }}
                    placeholder="e.g. LOLER 1998, ISO 9001" />
                </Field>
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: "#E0EAFF" }}>
                <button onClick={() => setShowModal(false)} disabled={saving}
                  className="px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: "#D1D5DB", color: "#374151" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 rounded-lg text-white text-[13px] font-semibold disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#0B3D91,#1D4ED8)" }}>
                  {saving ? "Saving…" : "Save Certificate"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
