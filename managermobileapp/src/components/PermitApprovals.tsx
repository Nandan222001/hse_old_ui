import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ArrowLeft, Check, X, ShieldCheck } from "lucide-react-native";
import type { ScreenProps } from "./types";

export function PermitApprovalsView({
  setCurrentScreen,
  permits,
  setPermits,
  showToast,
}: ScreenProps) {
  const pendingPermits = permits.filter((p) => p.status === "PENDING");

  const handleAction = (id: string, approve: boolean) => {
    setPermits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: approve ? "APPROVED" : "REJECTED" } : p))
    );
    showToast(`Permit ${id} was ${approve ? "APPROVED" : "REJECTED"}`);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen("app")}>
          <ArrowLeft size={22} color="#0B3D91" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permit Approvals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Pending Safety Permits ({pendingPermits.length})</Text>

        {pendingPermits.length === 0 ? (
          <View style={styles.emptyBox}>
            <ShieldCheck size={48} color="#10B981" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Queue Cleared</Text>
            <Text style={styles.emptyText}>All permits have been reviewed and resolved.</Text>
          </View>
        ) : (
          pendingPermits.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardId}>{item.id}</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending Review</Text>
                </View>
              </View>
              <Text style={styles.cardType}>{item.type}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>📍 Area: {item.area}</Text>
                <Text style={styles.metaText}>👤 Applicant: {item.applicant}</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleAction(item.id, false)}
                >
                  <X size={16} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleAction(item.id, true)}
                >
                  <Check size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  headerBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#0B3D91",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#63739B",
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    lineHeight: 18,
  },
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
    marginBottom: 8,
  },
  cardId: {
    fontSize: 12,
    fontWeight: "800",
    color: "#63739B",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
    textTransform: "uppercase",
  },
  cardType: {
    fontSize: 15,
    color: "#2D3748",
    fontWeight: "700",
    marginBottom: 8,
  },
  cardMeta: {
    borderBottomWidth: 1,
    borderColor: "#EDF2F7",
    paddingBottom: 10,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  rejectButton: {
    borderColor: "#FEB2B2",
    backgroundColor: "#FFF5F5",
  },
  approveButton: {
    borderColor: "#10B981",
    backgroundColor: "#10B981",
  },
  rejectText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  approveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
