import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AlertTriangle, ShieldCheck, ClipboardList, Zap, ListChecks, UserPlus } from "lucide-react-native";
import type { ScreenProps } from "../types";

export function TabB_SafetyPerformance({
  setCurrentScreen,
  incidents,
  permits,
  capaItems,
}: ScreenProps) {
  const openIncidents = incidents.filter((i) => i.status === "IN INVESTIGATION").length;
  const pendingPermits = permits.filter((p) => p.status === "PENDING").length;
  const pendingCapa = capaItems.filter((c) => !c.complianceChecked && c.status !== "Completed").length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerSub}>PRODUCTION FACILITY</Text>
        <Text style={styles.bannerTitle}>Safety Dashboard</Text>
        <Text style={styles.bannerStatus}>✅ 184 Days Injury Free</Text>
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
          style={styles.actionRow}
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

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomWidth: 0 }]}
          onPress={() => setCurrentScreen("add_supervisor")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
            <UserPlus size={20} color="#2563EB" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Add Supervisor</Text>
            <Text style={styles.rowDesc}>Create a supervisor account for your team</Text>
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

const styles = StyleSheet.create({
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
