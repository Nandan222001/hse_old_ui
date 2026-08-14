import { useEffect, useState, useCallback } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react-native";
import type { ScreenProps } from "./types";
import { apiClient } from "../../api/client";
import { incidentWorkflowService } from "../../services/incidentWorkflowService";

export function ComplianceApprovalsView({ setCurrentScreen, showToast }: ScreenProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/dashboard/capa-actions?limit=50")
      .then((r: any) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setItems(list.filter((c: any) => String(c.status).toLowerCase() !== "completed"));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Sign-off is a two-step flow: the spec makes effectiveness_rating required when a
  // CAPA is marked Completed, and it is the sole input to the CAPA Effectiveness KPI.
  const [ratingFor, setRatingFor] = useState<number | null>(null);
  const [rating, setRating] = useState(4);

  const confirmSignOff = async () => {
    const id = ratingFor;
    if (id == null) return;
    try {
      setBusy(id);
      setRatingFor(null);
      // The workflow endpoint, NOT `PUT /capa-actions/{id}`.
      //
      // The generic CRUD route writes the CAPA row and stops there. Only
      // `/incident-workflow/capa/{id}/complete` also advances the parent
      // incident from capa_open (stage 05 IMPROVE) to pending_verification
      // (stage 06 VERIFY) once its last outstanding action closes. Signing off
      // through the CRUD route left every incident stranded in IMPROVE with all
      // of its actions Completed — it could never reach VERIFY, LEARN or CLOSE.
      await incidentWorkflowService.completeCapaAction(id, rating);
      showToast?.(`CAPA-${id} signed off & closed`);
      load();
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.detail || "Could not sign off.");
    } finally {
      setBusy(null);
    }
  };

  const prioStyle = (p: string) => {
    const s = (p || "").toLowerCase();
    if (s.includes("crit")) return styles.critBg;
    if (s.includes("high")) return styles.hiBg;
    return styles.medBg;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen("app")}>
          <ArrowLeft size={22} color="#0B3D91" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compliance Approvals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={["#0B3D91"]} />}
      >
        <Text style={styles.sectionTitle}>Pending Sign-offs ({items.length})</Text>

        {loading && items.length === 0 ? (
          <ActivityIndicator color="#0B3D91" style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Queue Cleared</Text>
            <Text style={styles.emptyText}>All CAPA items have been compliance validated and closed.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardId}>CAPA-{item.id}</Text>
                <View style={[styles.priorityBadge, prioStyle(item.priority)]}>
                  <Text style={styles.priorityText}>{item.priority || item.action_type || "Action"}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>👤 {item.assignee || "Unassigned"}</Text>
                <Text style={[styles.metaText, item.is_overdue && { color: "#DC2626", fontWeight: "700" }]}>📅 {item.due_date || "—"}</Text>
              </View>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => { setRating(4); setRatingFor(item.id); }}
                disabled={busy === item.id}
              >
                {busy === item.id ? <ActivityIndicator size="small" color="#fff" /> : (
                  <><ShieldAlert size={16} color="#FFFFFF" style={{ marginRight: 6 }} /><Text style={styles.approveButtonText}>Sign-off & Close Action</Text></>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={ratingFor != null} transparent animationType="fade" onRequestClose={() => setRatingFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Effectiveness Rating</Text>
            <Text style={styles.ratingSub}>
              How effective was CAPA-{ratingFor} at addressing the root cause? This feeds the
              CAPA Effectiveness KPI.
            </Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.ratingBtn, rating === n && styles.ratingBtnActive]}
                  onPress={() => setRating(n)}
                >
                  <Text style={[styles.ratingBtnText, rating === n && styles.ratingBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ratingScaleRow}>
              <Text style={styles.ratingScaleText}>Not effective</Text>
              <Text style={styles.ratingScaleText}>Fully effective</Text>
            </View>
            <View style={styles.ratingActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRatingFor(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmSignOff}>
                <Text style={styles.confirmBtnText}>Sign Off</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  ratingCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, width: "100%" },
  ratingTitle: { fontSize: 17, fontWeight: "800", color: "#0B3D91", marginBottom: 6 },
  ratingSub: { fontSize: 13, color: "#718096", lineHeight: 18, marginBottom: 20 },
  ratingRow: { flexDirection: "row", gap: 8 },
  ratingBtn: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  ratingBtnActive: { backgroundColor: "#0B3D91", borderColor: "#0B3D91" },
  ratingBtnText: { fontSize: 16, fontWeight: "800", color: "#2D3748" },
  ratingBtnTextActive: { color: "#FFFFFF" },
  ratingScaleRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  ratingScaleText: { fontSize: 10, fontWeight: "700", color: "#A0AEC0" },
  ratingActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: "#718096" },
  confirmBtn: { flex: 1.4, height: 46, borderRadius: 12, backgroundColor: "#0B3D91", alignItems: "center", justifyContent: "center" },
  confirmBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  headerBar: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 16 },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#0B3D91" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#63739B", textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 },
  emptyBox: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", padding: 32, alignItems: "center", justifyContent: "center", marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#2D3748", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#718096", textAlign: "center", lineHeight: 18 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardId: { fontSize: 12, fontWeight: "800", color: "#63739B" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  critBg: { backgroundColor: "#FEE2E2" },
  hiBg: { backgroundColor: "#FFF7ED" },
  medBg: { backgroundColor: "#EFF6FF" },
  priorityText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", color: "#4A5568" },
  cardDesc: { fontSize: 14, color: "#2D3748", fontWeight: "600", lineHeight: 20, marginBottom: 10 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderColor: "#EDF2F7", paddingBottom: 10, marginBottom: 12 },
  metaText: { fontSize: 12, color: "#718096" },
  approveButton: { backgroundColor: "#3182CE", height: 40, borderRadius: 10, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  approveButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
