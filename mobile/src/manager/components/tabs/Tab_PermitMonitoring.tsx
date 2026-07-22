import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle2, FileText, ShieldCheck, User, X } from "lucide-react-native";
import type { ScreenProps } from "../types";
import {
  useManagerPermitQueue,
} from "../../../hooks/useManagerPermitQueue";
import type { PermitListItem } from "../../../services/permitWorkflowService";

/**
 * Manager Permits tab (flow 6, step 3): approve / reject permits a supervisor has
 * acknowledged, and monitor the permits that are currently active on site.
 *
 * Wired to the real /permit-workflow API — supersedes the old mock `permits` prop.
 */
export function Tab_PermitMonitoring({ showToast }: ScreenProps) {
  const { queue, active, isLoading, busyId, error, refresh, approve, reject } =
    useManagerPermitQueue();

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const confirmReject = (permit: PermitListItem) => {
    Alert.alert("Reject permit?", "The requester will see it was rejected.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          if (await reject(permit.id, "Rejected by manager")) showToast("Permit rejected");
        },
      },
    ]);
  };

  const handleApprove = async (permit: PermitListItem) => {
    if (await approve(permit.id)) showToast("Permit approved — now active");
  };

  const pendingCard = (permit: PermitListItem) => {
    const isBusy = busyId === permit.id;
    return (
      <View key={permit.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.idRow}>
            <FileText size={14} color="#4A5568" style={{ marginRight: 6 }} />
            <Text style={styles.cardId}>{permit.permit_ref ?? `#${permit.id}`}</Text>
          </View>
          <View style={[styles.statusBadge, styles.pendBg]}>
            <Text style={styles.statusText}>
              {(permit.workflow_status ?? "requested").toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {permit.work_description || "Permit to work"}
        </Text>

        {isBusy ? (
          <ActivityIndicator style={{ alignSelf: "flex-start", marginTop: 8 }} color="#0B3D91" />
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.workflowBtn, styles.rejectBtn]}
              onPress={() => confirmReject(permit)}
            >
              <X size={14} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.workflowBtn, styles.approveBtn]}
              onPress={() => handleApprove(permit)}
            >
              <CheckCircle2 size={14} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const activeCard = (permit: PermitListItem) => (
    <View key={permit.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.idRow}>
          <ShieldCheck size={14} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.cardId}>{permit.permit_ref ?? `#${permit.id}`}</Text>
        </View>
        <View style={[styles.statusBadge, styles.appBg]}>
          <Text style={styles.statusText}>ACTIVE</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {permit.work_description || "Permit to work"}
      </Text>
      {permit.validity_end && (
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <User size={12} color="#718096" style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>
              Valid until {new Date(permit.validity_end).toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.sectionHeader}>Awaiting Approval ({queue.length})</Text>
      {queue.length === 0 && !isLoading ? (
        <Text style={styles.emptySub}>No permits awaiting your approval.</Text>
      ) : (
        queue.map(pendingCard)
      )}

      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Active Permits ({active.length})</Text>
      {active.length === 0 && !isLoading ? (
        <Text style={styles.emptySub}>No active permits on site.</Text>
      ) : (
        active.map(activeCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#63739B",
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  error: { color: "#DC2626", fontSize: 12, marginBottom: 12, textAlign: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  idRow: { flexDirection: "row", alignItems: "center" },
  cardId: { fontSize: 11, fontWeight: "800", color: "#63739B" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  appBg: { backgroundColor: "#D1FAE5" },
  pendBg: { backgroundColor: "#FEF3C7" },
  statusText: { fontSize: 9, fontWeight: "800", color: "#4A5568" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#2D3748", marginBottom: 6 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  workflowBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  rejectBtn: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  rejectText: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
  approveBtn: { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
  approveText: { color: "#059669", fontSize: 12, fontWeight: "700" },
  cardFooter: { borderTopWidth: 1, borderColor: "#EDF2F7", paddingTop: 10, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 12, color: "#718096" },
  emptySub: { fontSize: 13, color: "#718096", textAlign: "center", lineHeight: 18 },
});
