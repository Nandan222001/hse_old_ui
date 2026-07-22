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
import { AlertCircle, CheckCircle2, Eye, RotateCcw, TriangleAlert } from "lucide-react-native";
import type { ScreenProps } from "../types";
import {
  useManagerReportQueue,
  type ManagerQueueItem,
} from "../../../hooks/useManagerReportQueue";
import { ReportClosureModal, type ClosureFormValues } from "../ReportClosureModal";

/**
 * Manager approvals for worker-reported near misses, unsafe acts and risks —
 * the final step of Worker → Supervisor → Manager.
 *
 * Two states land here: `escalated` (high/critical, sent straight up) and
 * `pending_approval` (supervisor finished investigating). The manager either sends
 * it back for redo or closes it out.
 */

const TYPE_META: Record<string, { label: string; icon: typeof AlertCircle; color: string }> = {
  near_miss: { label: "Near Miss", icon: TriangleAlert, color: "#F97316" },
  unsafe_act: { label: "Unsafe Act", icon: Eye, color: "#8B5CF6" },
  risk: { label: "Risk", icon: AlertCircle, color: "#DC2626" },
};

const SEVERITY_BG: Record<string, string> = {
  low: "#EFF6FF",
  medium: "#EFF6FF",
  high: "#FFF7ED",
  critical: "#FEE2E2",
};

function statusLabel(item: ManagerQueueItem): string {
  return item.workflow_status === "escalated"
    ? "Escalated by supervisor"
    : "Investigation complete — awaiting approval";
}

export function TabB_ReportApprovals({ showToast }: ScreenProps) {
  const { queue, isLoading, busyId, error, refresh, approve, close } = useManagerReportQueue();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [closing, setClosing] = useState<ManagerQueueItem | null>(null);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const confirmSendBack = (item: ManagerQueueItem) => {
    Alert.alert("Send back for redo?", "The supervisor will investigate this again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send back",
        style: "destructive",
        onPress: async () => {
          if (await approve(item, false)) showToast("Sent back to supervisor");
        },
      },
    ]);
  };

  const submitClosure = async (values: ClosureFormValues) => {
    if (!closing) return;
    const item = closing;
    setClosing(null);
    // Escalated items skip the approval step, so approve first to stamp approved_at.
    if (item.workflow_status === "escalated") await approve(item, true);
    if (await close(item, values)) showToast("Report closed");
  };

  const renderCard = (item: ManagerQueueItem) => {
    const meta = TYPE_META[item.report_type] ?? TYPE_META.risk;
    const Icon = meta.icon;
    const sev = (item.severity ?? "medium").toLowerCase();
    const key = `${item.report_type}:${item.id}`;
    const isBusy = busyId === key;
    const isOpen = expanded === key;

    return (
      <TouchableOpacity
        key={key}
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setExpanded(isOpen ? null : key)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idRow}>
            <Icon size={16} color={meta.color} style={{ marginRight: 6 }} />
            <Text style={styles.cardId}>
              {meta.label} #{item.id}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: SEVERITY_BG[sev] ?? "#EFF6FF" }]}>
            <Text style={styles.severityText}>{sev}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={isOpen ? undefined : 3}>
          {item.description || "No description provided"}
        </Text>
        <Text style={styles.cardStatus}>{statusLabel(item)}</Text>

        {isBusy ? (
          <ActivityIndicator style={styles.busy} color="#0B3D91" />
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.workflowBtn, styles.redoBtn]}
              onPress={() => confirmSendBack(item)}
            >
              <RotateCcw size={14} color="#B45309" style={{ marginRight: 4 }} />
              <Text style={styles.redoText}>Send back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.workflowBtn, styles.closeBtn]}
              onPress={() => setClosing(item)}
            >
              <CheckCircle2 size={14} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.closeText}>Approve & close</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      <Text style={styles.sectionHeader}>Awaiting Your Approval</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {queue.length === 0 && !isLoading && !error ? (
        <View style={styles.empty}>
          <CheckCircle2 size={40} color="#A0AEC0" />
          <Text style={styles.emptyTitle}>Nothing awaiting approval</Text>
          <Text style={styles.emptySub}>
            Reports appear here once a supervisor escalates or finishes investigating.
          </Text>
        </View>
      ) : (
        queue.map(renderCard)
      )}

      <ReportClosureModal
        visible={closing !== null}
        reportLabel={
          closing
            ? `${TYPE_META[closing.report_type]?.label ?? "Report"} #${closing.id} · ${closing.description ?? ""}`
            : ""
        }
        isSubmitting={busyId !== null && closing !== null && busyId === `${closing.report_type}:${closing.id}`}
        onCancel={() => setClosing(null)}
        onSubmit={submitClosure}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1 },
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
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#4A5568",
  },
  cardDesc: { fontSize: 13, color: "#4A5568", lineHeight: 18, marginBottom: 8 },
  cardStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: "#718096",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  busy: { alignSelf: "flex-start" },
  actionRow: { flexDirection: "row", gap: 8 },
  workflowBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  redoBtn: { borderColor: "#FDE68A", backgroundColor: "#FFFBEB" },
  redoText: { color: "#B45309", fontSize: 12, fontWeight: "700" },
  closeBtn: { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
  closeText: { color: "#059669", fontSize: 12, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#4A5568", textAlign: "center" },
  emptySub: { fontSize: 13, color: "#718096", textAlign: "center", lineHeight: 18 },
});
