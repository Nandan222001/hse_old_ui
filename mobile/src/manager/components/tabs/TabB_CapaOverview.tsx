import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Check, Clock, User, Calendar } from "lucide-react-native";
import type { ScreenProps } from "../types";

export function TabB_CapaOverview({ capaItems }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionHeader}>CAPA Corrective Actions Registry</Text>

      {capaItems.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardId}>{item.id}</Text>
            <View
              style={[
                styles.statusBadge,
                item.status === "Completed"
                  ? styles.compBg
                  : item.status === "In Progress"
                  ? styles.progBg
                  : styles.openBg,
              ]}
            >
              {item.status === "Completed" ? (
                <Check size={10} color="#059669" style={{ marginRight: 2 }} />
              ) : (
                <Clock size={10} color="#D97706" style={{ marginRight: 2 }} />
              )}
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <Text style={styles.cardDesc}>{item.desc}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <User size={12} color="#718096" style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.assignee}</Text>
            </View>
            <View style={styles.metaRow}>
              <Calendar size={12} color="#718096" style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.dueDate}</Text>
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
  cardId: {
    fontSize: 11,
    fontWeight: "800",
    color: "#63739B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compBg: {
    backgroundColor: "#D1FAE5",
  },
  progBg: {
    backgroundColor: "#FEF3C7",
  },
  openBg: {
    backgroundColor: "#EFF6FF",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#4A5568",
  },
  cardDesc: {
    fontSize: 14,
    color: "#2D3748",
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
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
