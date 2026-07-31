import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { AlertTriangle, ShieldCheck, ClipboardList, Zap, ListChecks } from "lucide-react-native";
import type { ScreenProps } from "../types";
import { apiClient } from "../../../api/client";

/** Module 1/2/4 KPIs from the architecture diagram, as returned by the KPI engine. */
interface LeadingIndicators {
  trir?: number;
  ltifr?: number;
  ltisr?: number;
  dart_rate?: number;
  far?: number;
  near_miss_ratio?: number;
  safe_days?: number;
  incident_close_out_rate?: number;
}

interface DashboardStats {
  open_capa_actions?: number;
  overdue_capa?: number;
  capa_completion_rate?: number;
  avg_compliance_rating?: number;
}

/** Rates can be large or fractional; keep them readable without lying about precision. */
function fmt(n: number | undefined, digits = 2): string {
  if (n == null || isNaN(n)) return "—";
  return n >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(digits);
}

export function TabB_SafetyPerformance({
  setCurrentScreen,
  incidents,
  permits,
  capaItems,
}: ScreenProps) {
  const openIncidents = incidents.filter((i) => i.status === "IN INVESTIGATION").length;
  const pendingPermits = permits.filter((p) => p.status === "PENDING").length;
  const pendingCapa = capaItems.filter((c) => !c.complianceChecked && c.status !== "Completed").length;

  const [kpi, setKpi] = useState<LeadingIndicators>({});
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  const loadKpis = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get("/dashboard/leading-indicators").then((r: any) => r.data).catch(() => ({})),
      apiClient.get("/dashboard/stats").then((r: any) => r.data).catch(() => ({})),
    ])
      .then(([li, st]) => { setKpi(li ?? {}); setStats(st ?? {}); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadKpis(); }, [loadKpis]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadKpis} colors={["#0B3D91"]} />}
    >
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerSub}>PRODUCTION FACILITY</Text>
        <Text style={styles.bannerTitle}>Safety Dashboard</Text>
        <Text style={styles.bannerStatus}>
          {kpi.safe_days != null ? `✅ ${kpi.safe_days} Days Injury Free` : "Safe days —"}
        </Text>
      </View>

      {/* Module 1 — Incidents & Events */}
      <Text style={styles.sectionHeader}>Module 1 · Incidents &amp; Events</Text>
      <View style={styles.kpiGrid}>
        <KpiTile label="TRIR" sub="per 200k hrs" value={fmt(kpi.trir)} />
        <KpiTile label="LTIFR" sub="per 1M hrs" value={fmt(kpi.ltifr)} />
        <KpiTile label="LTISR" sub="per 1M hrs" value={fmt(kpi.ltisr)} />
        <KpiTile label="DART" sub="per 200k hrs" value={fmt(kpi.dart_rate)} />
        <KpiTile label="FAR" sub="per 100M hrs" value={fmt(kpi.far)} />
        <KpiTile label="Near Miss Ratio" sub="NM ÷ recordables" value={fmt(kpi.near_miss_ratio, 1)} />
      </View>

      {/* Module 2 — Risk & CAPA */}
      <Text style={styles.sectionHeader}>Module 2 · Risk &amp; CAPA</Text>
      <View style={styles.kpiGrid}>
        <KpiTile label="Close-Out Rate" sub="investigations" value={kpi.incident_close_out_rate != null ? `${fmt(kpi.incident_close_out_rate, 1)}%` : "—"} />
        <KpiTile label="CAPA Closure" sub="completed ÷ total" value={stats.capa_completion_rate != null ? `${fmt(stats.capa_completion_rate, 1)}%` : "—"} />
        <KpiTile label="Overdue CAPA" sub="count" value={stats.overdue_capa != null ? String(stats.overdue_capa) : "—"} />
        <KpiTile label="Walk Compliance" sub="avg rating / 5" value={stats.avg_compliance_rating != null ? `${fmt(stats.avg_compliance_rating, 1)}` : "—"} />
      </View>

      {/* Stats Summary Cards */}
      <Text style={styles.sectionHeader}>Active Metrics</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: "#EF4444" }]}>
          <Text style={styles.statVal}>{openIncidents}</Text>
          <Text style={styles.statLbl}>Open Incidents</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
          <Text style={styles.statVal}>{pendingPermits}</Text>
          <Text style={styles.statLbl}>Pending Permits</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#3B82F6" }]}>
          <Text style={styles.statVal}>{pendingCapa}</Text>
          <Text style={styles.statLbl}>Pending CAPAs</Text>
        </View>
      </View>

      {/* Quick Approval Actions Panel */}
      <Text style={styles.sectionHeader}>Pending Approval Queues</Text>
      <View style={styles.approvalPanel}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setCurrentScreen("permit_approvals")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
            <ShieldCheck size={20} color="#D97706" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Permits Queue</Text>
            <Text style={styles.rowDesc}>{pendingPermits} safety permits awaiting review</Text>
          </View>
          <Zap size={16} color="#A0AEC0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setCurrentScreen("compliance_approvals")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
            <ClipboardList size={20} color="#2563EB" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Compliance Sign-off</Text>
            <Text style={styles.rowDesc}>{pendingCapa} CAPA closures needing validation</Text>
          </View>
          <Zap size={16} color="#A0AEC0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomWidth: 0 }]}
          onPress={() => setCurrentScreen("assigned_tasks")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#E0F2F1" }]}>
            <ListChecks size={20} color="#12B8A6" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Assigned Tasks</Text>
            <Text style={styles.rowDesc}>Supervisor tasks — view responses & edit checklist</Text>
          </View>
          <Zap size={16} color="#A0AEC0" />
        </TouchableOpacity>
      </View>

      {/* Incident Hazard Alert Card */}
      {openIncidents > 0 && (
        <View style={styles.alertCard}>
          <AlertTriangle size={24} color="#EF4444" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Immediate Attention Required</Text>
            <Text style={styles.alertText}>
              There are {openIncidents} incident reports awaiting Root Cause Analysis and corrective action mapping.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function KpiTile({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <View style={styles.kpiTile}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  kpiTile: {
    flexGrow: 1, flexBasis: "30%", minWidth: 100,
    backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0",
    paddingVertical: 14, paddingHorizontal: 12,
  },
  kpiValue: { fontSize: 20, fontWeight: "800", color: "#0B3D91" },
  kpiLabel: { fontSize: 11, fontWeight: "800", color: "#2D3748", marginTop: 4 },
  kpiSub: { fontSize: 9, fontWeight: "600", color: "#94A3B8", marginTop: 2 },
  container: {
    padding: 16,
  },
  banner: {
    backgroundColor: "#0B3D91",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#0B3D91",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerSub: {
    fontSize: 10,
    fontWeight: "800",
    color: "#93C5FD",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  bannerStatus: {
    fontSize: 13,
    color: "#F6AD55",
    fontWeight: "700",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#63739B",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    padding: 12,
    alignItems: "center",
  },
  statVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 10,
    color: "#718096",
    fontWeight: "600",
  },
  approvalPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F0F4F8",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 11,
    color: "#718096",
  },
  alertCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 2,
  },
  alertText: {
    fontSize: 12,
    color: "#991B1B",
    lineHeight: 16,
  },
});
