import { useEffect, useState, useCallback } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react-native";
import type { ScreenProps } from "./types";
import { apiClient } from "../../api/client";

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

  const signOff = async (id: number) => {
    try {
      setBusy(id);
      await apiClient.put(`/capa-actions/${id}`, { status: "Completed" });
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
              <TouchableOpacity style={styles.approveButton} onPress={() => signOff(item.id)} disabled={busy === item.id}>
                {busy === item.id ? <ActivityIndicator size="small" color="#fff" /> : (
                  <><ShieldAlert size={16} color="#FFFFFF" style={{ marginRight: 6 }} /><Text style={styles.approveButtonText}>Sign-off & Close Action</Text></>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
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
