import { useEffect, useState } from "react";
import { FileCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { getEquipmentCertifications, type EquipmentCertification, type EquipmentCertFilters } from "../../services/analytics.service";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const STATUS_COLORS: Record<string, string> = {
  Valid: "bg-blue-100 text-blue-700",
  "Expiring Soon": "bg-yellow-100 text-yellow-700",
  Expired: "bg-red-100 text-red-700",
};

export function EquipmentCertificationPage() {
  const [records, setRecords] = useState<EquipmentCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EquipmentCertFilters>({});

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
    total: records.length,
    valid: records.filter(r => r.Status === "Valid").length,
    expiringSoon: records.filter(r => r.Status === "Expiring Soon").length,
    expired: records.filter(r => r.Status === "Expired").length,
  };

  const equipmentTypes = [...new Set(records.map(r => r.Equipment_Type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipment Certification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track equipment certifications and inspection records.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Equipment", value: stats.total, color: "text-gray-900" },
          { label: "Valid", value: stats.valid, color: "text-blue-600" },
          { label: "Expiring Soon", value: stats.expiringSoon, color: "text-yellow-600" },
          { label: "Expired", value: stats.expired, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert banner for expired/expiring */}
      {(stats.expired > 0 || stats.expiringSoon > 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            {stats.expired > 0 && (
              <span className="font-semibold">{stats.expired} expired</span>
            )}
            {stats.expired > 0 && stats.expiringSoon > 0 && " and "}
            {stats.expiringSoon > 0 && (
              <span className="font-semibold">{stats.expiringSoon} expiring soon</span>
            )}{" "}
            — review and schedule recertification.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.status ?? "all"}
          onValueChange={v => setFilters(f => ({ ...f, status: v === "all" ? undefined : v }))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Valid", "Expiring Soon", "Expired"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.equipment_type ?? "all"}
          onValueChange={v => setFilters(f => ({ ...f, equipment_type: v === "all" ? undefined : v }))}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Equipment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {equipmentTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
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
            <div className="p-6 text-center text-sm text-muted-foreground">No records found.</div>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.Cert_ID} className={r.Status === "Expired" ? "bg-red-50" : r.Status === "Expiring Soon" ? "bg-yellow-50" : ""}>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
