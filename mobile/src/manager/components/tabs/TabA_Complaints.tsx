import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Search, CheckCircle2, MessageSquare } from "lucide-react-native";
import type { ScreenProps } from "../types";

export function TabA_Complaints({
  complaints,
  complaintSearch,
  setComplaintSearch,
}: ScreenProps) {
  const filtered = complaints.filter((c) =>
    c.title.toLowerCase().includes(complaintSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#718096" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search complaints register..."
          placeholderTextColor="#A0AEC0"
          value={complaintSearch}
          onChangeText={setComplaintSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Employee Feedback Register</Text>

        {filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.idRow}>
                <MessageSquare size={14} color="#63739B" style={{ marginRight: 6 }} />
                <Text style={styles.cardId}>{item.id}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "RESOLVED" ? styles.resBg : styles.unresBg,
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>📂 Category: {item.category}</Text>
              <Text style={styles.metaText}>📅 Reported: {item.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#2D3748",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
    marginBottom: 8,
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
  resBg: {
    backgroundColor: "#D1FAE5",
  },
  unresBg: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4A5568",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#EDF2F7",
    paddingTop: 10,
  },
  metaText: {
    fontSize: 11,
    color: "#718096",
  },
});
