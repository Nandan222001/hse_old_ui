import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Sparkles, CheckCircle } from "lucide-react-native";
import type { ScreenProps } from "./types";

export function InvestigationScreenView({
  setCurrentScreen,
  selectedIncident,
  whys,
  setWhys,
  setRcaDone,
  showToast,
  isGeneratingAI,
  handleAIDraft,
}: ScreenProps) {
  const handleSave = () => {
    if (!whys.why1) {
      showToast("Please provide at least the first 'Why'");
      return;
    }
    setRcaDone(true);
    showToast("RCA investigation completed");
    setCurrentScreen("app");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen("app")}>
          <ArrowLeft size={22} color="#0B3D91" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Root Cause Analysis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Incident Summary Card */}
        <View style={styles.incidentCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.incidentId}>{selectedIncident.id}</Text>
            <View style={[styles.severityBadge, selectedIncident.severity === "Critical" ? styles.criticalBg : styles.highBg]}>
              <Text style={styles.severityText}>{selectedIncident.severity}</Text>
            </View>
          </View>
          <Text style={styles.incidentTitle}>{selectedIncident.title}</Text>
          <Text style={styles.incidentDesc}>{selectedIncident.desc}</Text>
        </View>

        {/* 5 Whys Box */}
        <View style={styles.rcaBox}>
          <View style={styles.rcaHeader}>
            <View>
              <Text style={styles.rcaTitle}>5 Whys Methodology</Text>
              <Text style={styles.rcaSubtitle}>Identify root cause by asking "Why" sequentially</Text>
            </View>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={handleAIDraft}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.aiButtonText}>AI Draft</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Whys Inputs */}
          {(Object.keys(whys) as Array<keyof typeof whys>).map((key, idx) => {
            const whyNum = idx + 1;
            return (
              <View key={key} style={styles.whyItem}>
                <View style={styles.whyNumberCircle}>
                  <Text style={styles.whyNumberText}>{whyNum}</Text>
                </View>
                <View style={styles.whyInputWrapper}>
                  <Text style={styles.whyLabel}>Why did this happen?</Text>
                  <TextInput
                    style={styles.whyInput}
                    value={whys[key]}
                    onChangeText={(text) => setWhys((prev) => ({ ...prev, [key]: text }))}
                    placeholder={`Enter explanation for step ${whyNum}...`}
                    placeholderTextColor="#A0AEC0"
                    multiline
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <CheckCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitButtonText}>Complete Investigation</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  incidentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  incidentId: {
    fontSize: 12,
    fontWeight: "800",
    color: "#63739B",
    letterSpacing: 0.5,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  criticalBg: {
    backgroundColor: "#FEE2E2",
  },
  highBg: {
    backgroundColor: "#FEF3C7",
  },
  severityText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#DC2626",
  },
  incidentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 8,
  },
  incidentDesc: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 20,
  },
  rcaBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 24,
  },
  rcaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#F0F4F8",
    paddingBottom: 12,
    marginBottom: 16,
  },
  rcaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3748",
  },
  rcaSubtitle: {
    fontSize: 11,
    color: "#718096",
  },
  aiButton: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  whyItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  whyNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBF8FF",
    borderWidth: 1.5,
    borderColor: "#3182CE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 20,
  },
  whyNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3182CE",
  },
  whyInputWrapper: {
    flex: 1,
  },
  whyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#718096",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  whyInput: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#2D3748",
    minHeight: 48,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#10B981",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
