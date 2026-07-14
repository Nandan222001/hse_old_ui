import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AlertCircle, ChevronRight, UserPlus, HelpCircle } from "lucide-react-native";
import type { ScreenProps } from "../types";

export function TabB_Risks({
  incidents,
  setCurrentScreen,
  setSelectedIncident,
}: ScreenProps) {
  const handleStartRca = (incident: typeof incidents[0]) => {
    setSelectedIncident(incident);
    setCurrentScreen("investigation");
  };

  const handleAssignActions = (incident: typeof incidents[0]) => {
    setSelectedIncident(incident);
    setCurrentScreen("assign_actions");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionHeader}>Active Incident Registry</Text>

      {incidents.map((incident) => (
        <View key={incident.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.idRow}>
              <AlertCircle size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.cardId}>{incident.id}</Text>
            </View>
            <View
              style={[
                styles.severityBadge,
                incident.severity === "Critical"
                  ? styles.critBg
                  : incident.severity === "High"
                  ? styles.hiBg
                  : styles.medBg,
              ]}
            >
              <Text style={styles.severityText}>{incident.severity}</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{incident.title}</Text>
          <Text style={styles.cardDesc}>{incident.desc}</Text>
          <Text style={styles.cardStatus}>Status: {incident.status}</Text>

          {/* Action Workflows */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.workflowBtn, styles.rcaBtn]}
              onPress={() => handleStartRca(incident)}
            >
              <HelpCircle size={14} color="#3182CE" style={{ marginRight: 4 }} />
              <Text style={styles.rcaText}>Root Cause (5 Whys)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.workflowBtn, styles.assignBtn]}
              onPress={() => handleAssignActions(incident)}
            >
              <UserPlus size={14} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.assignText}>Assign CAPA</Text>
            </TouchableOpacity>
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
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  critBg: {
    backgroundColor: "#FEE2E2",
  },
  hiBg: {
    backgroundColor: "#FFF7ED",
  },
  medBg: {
    backgroundColor: "#EFF6FF",
  },
  severityText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#4A5568",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: "#4A5568",
    lineHeight: 18,
    marginBottom: 10,
  },
  cardStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: "#718096",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  workflowBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  rcaBtn: {
    borderColor: "#BEE3F8",
    backgroundColor: "#EBF8FF",
  },
  assignBtn: {
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },
  rcaText: {
    color: "#2B6CB0",
    fontSize: 12,
    fontWeight: "700",
  },
  assignText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
  },
});
