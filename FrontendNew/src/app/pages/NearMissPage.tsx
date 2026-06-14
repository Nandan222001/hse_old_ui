import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { getNearMiss, type NearMiss, type NearMissFilters } from "../../services/analytics.service";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-blue-100 text-blue-700",
};

const STATUS_COLORS: Record<string, string> = {
  Closed: "bg-blue-100 text-blue-700",
  "Under Investigation": "bg-blue-100 text-blue-700",
  Open: "bg-red-100 text-red-700",
};

const INV_STATUS_COLORS: Record<string, string> = {
  Completed: "bg-blue-100 text-blue-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export function NearMissPage() {
  const [records, setRecords] = useState<NearMiss[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NearMissFilters>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNearMiss(filters);
      setRecords(data);
    } catch {
      setError("Failed to load near miss records. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const stats = {
    total: records.length,
    critical: records.filter(r => r.Severity === "Critical").length,
    open: records.filter(r => r.Status !== "Closed").length,
    closed: records.filter(r => r.Status === "Closed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Near Miss</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Report and analyze near miss incidents.
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
          { label: "Total Incidents", value: stats.total, color: "text-gray-900" },
          { label: "Critical", value: stats.critical, color: "text-red-600" },
          { label: "Under Investigation", value: stats.open, color: "text-blue-600" },
          { label: "Closed", value: stats.closed, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.severity ?? "all"}
          onValueChange={v => setFilters(f => ({ ...f, severity: v === "all" ? undefined : v }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {["Critical", "High", "Medium", "Low"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status ?? "all"}
          onValueChange={v => setFilters(f => ({ ...f, status: v === "all" ? undefined : v }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Closed", "Under Investigation"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Incidents ({records.length})
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
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Site / Zone</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Investigation</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Incident Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.NearMiss_ID}>
                      <TableCell className="font-mono text-xs">{r.NearMiss_ID}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="font-medium text-sm truncate" title={r.Title}>{r.Title}</p>
                        <p className="text-xs text-muted-foreground truncate" title={r.Potential_Outcome}>
                          Risk: {r.Potential_Outcome}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{r.Category}</TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{r.Site_ID}</span>
                        <span className="text-muted-foreground"> / {r.Zone_ID}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${SEVERITY_COLORS[r.Severity] ?? ""}`} variant="outline">
                          {r.Severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[r.Status] ?? ""}`} variant="outline">
                          {r.Status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${INV_STATUS_COLORS[r.Investigation_Status] ?? ""}`} variant="outline">
                          {r.Investigation_Status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.Reported_By}</TableCell>
                      <TableCell className="text-sm">{r.Incident_Date}</TableCell>
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
