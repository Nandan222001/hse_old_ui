import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ShieldAlert, FileText, CheckCircle2, User } from "lucide-react-native";
import type { ScreenProps } from "../types";

export function Tab_PermitMonitoring({ permits }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionHeader}>Permits To Work (PTW)</Text>

      {permits.map((permit) => (
        <View key={permit.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.idRow}>
              <FileText size={14} color="#4A5568" style={{ marginRight: 6 }} />
              <Text style={styles.cardId}>{permit.id}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                permit.status === "APPROVED"
                  ? styles.appBg
                  : permit.status === "PENDING"
                  ? styles.pendBg
                  : styles.rejBg,
              ]}
            >
              <Text style={styles.statusText}>{permit.status}</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{permit.type}</Text>
          <Text style={styles.cardArea}>📍 Area: {permit.area}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <User size={12} color="#718096" style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>Applicant: {permit.applicant}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#63739B",
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 0.5,
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
    marginBottom: 10,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardId: {
    fontSize: 11,
    fontWeight: "800",
    color: "#63739B",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appBg: {
    backgroundColor: "#D1FAE5",
  },
  pendBg: {
    backgroundColor: "#FEF3C7",
  },
  rejBg: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4A5568",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 6,
  },
  cardArea: {
    fontSize: 12,
    color: "#4A5568",
    marginBottom: 10,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderColor: "#EDF2F7",
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#718096",
  },
});
