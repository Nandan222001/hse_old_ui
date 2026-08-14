import { useEffect, useState, useCallback } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator,
  RefreshControl, Alert, Modal, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, ShieldAlert } from "lucide-react-native";
import type { ScreenProps } from "./types";
import { apiClient } from "../../api/client";

interface HazardRow {
  id: number;
  hazard_name: string | null;
  severity: string | null;
  probability: string | null;
  register_status: string | null;
  controls: string | null;
  // Derived server-side from register_status. Kept on the type because the
  // API returns it, even though the stage rail is not rendered.
  stage?: string | null;
  stage_number?: number | null;
  stage_label?: string | null;
  completed_stages?: string[];
  total_stages?: number | null;
}

interface Station { id: number; station_name: string }
interface Category { id: number; category_name?: string; name?: string }

const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const PROBABILITIES = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
const REGISTER_STATUSES = ["open", "under_review", "controlled", "closed"];

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  controlled: "Under Control",
  closed: "Closed",
};

function severityColor(s: string | null) {
  switch ((s || "").toLowerCase()) {
    case "critical": return { color: "#B91C1C", bg: "#FEF2F2" };
    case "high": return { color: "#EA580C", bg: "#FFF7ED" };
    case "medium": return { color: "#CA8A04", bg: "#FEFCE8" };
    default: return { color: "#16A34A", bg: "#F0FDF4" };
  }
}

export function HazardRegisterScreen({ setCurrentScreen, showToast }: ScreenProps) {
  const [rows, setRows] = useState<HazardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [hazardName, setHazardName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [severity, setSeverity] = useState("Medium");
  const [probability, setProbability] = useState("Possible");
  const [description, setDescription] = useState("");
  const [stationId, setStationId] = useState<number | null>(null);
  const [controls, setControls] = useState("");
  const [registerStatus, setRegisterStatus] = useState("open");

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/hazard-register/")
      .then((r: any) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    apiClient.get("/working-stations/")
      .then((r: any) => {
        const list: Station[] = Array.isArray(r.data) ? r.data : [];
        setStations(list);
        setStationId(prev => prev ?? list[0]?.id ?? null);
      })
      .catch(() => setStations([]));
    apiClient.get("/hazard-categorys/")
      .then((r: any) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, [load]);

  const resetForm = () => {
    setHazardName("");
    setDescription("");
    setControls("");
    setSeverity("Medium");
    setProbability("Possible");
    setRegisterStatus("open");
  };

  const submit = async () => {
    if (!hazardName.trim()) {
      Alert.alert("Required", "Enter a hazard name.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.post("/hazard-register/log", {
        hazard_name: hazardName.trim(),
        category_id: categoryId ?? undefined,
        description: description.trim() || undefined,
        severity,
        probability,
        location_station_id: stationId ?? undefined,
        controls: controls.trim() || undefined,
      });

      // The log endpoint always opens a hazard; if the manager picked a different
      // lifecycle state, move it there straight away via the review endpoint.
      if (registerStatus !== "open" && data?.id) {
        await apiClient.post(`/hazard-register/${data.id}/review`, {
          register_status: registerStatus,
        });
      }

      showToast?.(`Hazard "${hazardName.trim()}" added to the register`);
      setFormVisible(false);
      resetForm();
      load();
    } catch (e: any) {
      Alert.alert("Save Failed", e?.response?.data?.detail || "Could not add the hazard.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen("app")}>
          <ArrowLeft size={22} color="#0B3D91" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hazard Register</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setFormVisible(true)}>
          <Plus size={20} color="#0B3D91" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={["#0B3D91"]} />}
      >
        <Text style={styles.sectionTitle}>Registered Hazards ({rows.length})</Text>

        {loading && rows.length === 0 ? (
          <ActivityIndicator color="#0B3D91" style={{ marginTop: 30 }} />
        ) : rows.length === 0 ? (
          <View style={styles.emptyBox}>
            <ShieldAlert size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Register Empty</Text>
            <Text style={styles.emptyText}>No hazards have been logged yet.</Text>
          </View>
        ) : (
          rows.map(h => {
            const sev = severityColor(h.severity);
            return (
              <View key={h.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{h.hazard_name || `Hazard ${h.id}`}</Text>
                  <View style={[styles.badge, { backgroundColor: sev.bg }]}>
                    <Text style={[styles.badgeText, { color: sev.color }]}>
                      {(h.severity || "—").toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  {STATUS_LABEL[h.register_status || "open"] ?? h.register_status}
                  {h.probability ? ` · ${h.probability}` : ""}
                </Text>
                {h.controls ? <Text style={styles.cardControls}>Controls: {h.controls}</Text> : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Hazard Entry</Text>
            <ScrollView style={styles.sheetScroll}>
              <Text style={styles.fieldLabel}>HAZARD NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Unguarded conveyor pinch point"
                placeholderTextColor="#A0AEC0"
                value={hazardName}
                onChangeText={setHazardName}
              />

              {categories.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>CATEGORY</Text>
                  <View style={styles.pillWrap}>
                    {categories.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.pill, categoryId === c.id && styles.pillActive]}
                        onPress={() => setCategoryId(c.id)}
                      >
                        <Text style={[styles.pillText, categoryId === c.id && styles.pillTextActive]}>
                          {c.category_name ?? c.name ?? `Category ${c.id}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>SEVERITY</Text>
              <View style={styles.pillWrap}>
                {SEVERITIES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.pill, severity === s && styles.pillActive]}
                    onPress={() => setSeverity(s)}
                  >
                    <Text style={[styles.pillText, severity === s && styles.pillTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>PROBABILITY</Text>
              <View style={styles.pillWrap}>
                {PROBABILITIES.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pill, probability === p && styles.pillActive]}
                    onPress={() => setProbability(p)}
                  >
                    <Text style={[styles.pillText, probability === p && styles.pillTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="What is the hazard and who is exposed?"
                placeholderTextColor="#A0AEC0"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.fieldLabel}>LOCATION / STATION</Text>
              <View style={styles.pillWrap}>
                {stations.map(st => (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.pill, stationId === st.id && styles.pillActive]}
                    onPress={() => setStationId(st.id)}
                  >
                    <Text style={[styles.pillText, stationId === st.id && styles.pillTextActive]}>
                      {st.station_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>CONTROLS / MITIGATIONS</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="What controls are in place or planned?"
                placeholderTextColor="#A0AEC0"
                multiline
                value={controls}
                onChangeText={setControls}
              />

              <Text style={styles.fieldLabel}>REGISTER STATUS</Text>
              <View style={styles.pillWrap}>
                {REGISTER_STATUSES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.pill, registerStatus === s && styles.pillActive]}
                    onPress={() => setRegisterStatus(s)}
                  >
                    <Text style={[styles.pillText, registerStatus === s && styles.pillTextActive]}>
                      {STATUS_LABEL[s]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={submit} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={styles.saveBtnText}>Add to Register</Text>}
                </TouchableOpacity>
              </View>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  headerBar: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 16,
  },
  backButton: { padding: 8 },
  addButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#0B3D91" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: "800", color: "#63739B",
    textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5,
  },
  emptyBox: {
    backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0",
    padding: 32, alignItems: "center", justifyContent: "center", marginTop: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#2D3748", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#718096", textAlign: "center" },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0",
    padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#2D3748" },
  cardMeta: { fontSize: 12, color: "#718096", marginTop: 6 },
  cardControls: { fontSize: 12, color: "#4A5568", marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: "90%",
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: "#0B3D91", marginBottom: 4 },
  sheetScroll: { maxHeight: "100%" },
  fieldLabel: {
    fontSize: 11, fontWeight: "800", color: "#63739B",
    letterSpacing: 0.6, marginTop: 18, marginBottom: 8,
  },
  input: {
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12,
    paddingHorizontal: 14, height: 46, fontSize: 14, color: "#2D3748",
  },
  multiline: { height: 80, paddingTop: 12, textAlignVertical: "top" },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 14, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  pillActive: { backgroundColor: "#0B3D91", borderColor: "#0B3D91" },
  pillText: { fontSize: 13, fontWeight: "700", color: "#2D3748" },
  pillTextActive: { color: "#FFFFFF" },
  actions: { flexDirection: "row", gap: 12, marginTop: 28 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: "#718096" },
  saveBtn: {
    flex: 1.4, height: 48, borderRadius: 12, backgroundColor: "#0B3D91",
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});
