import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Menu,
  LayoutGrid,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  User,
  X,
  UserPlus,
  ListChecks,
  ClipboardCheck,
  FileCheck2,
  Wrench,
  ChevronRight,
} from "lucide-react-native";
import type { ScreenProps } from "./types";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../../components";

// New Figma-aligned manager tabs.
import { MgrMonitoring } from "./tabs/MgrMonitoring";
import { MgrRisk } from "./tabs/MgrRisk";
import { MgrPermits } from "./tabs/MgrPermits";
import { MgrComplaints } from "./tabs/MgrComplaints";
import { Tab_Profile } from "./tabs/Tab_Profile";

export function AppContainerView(props: ScreenProps) {
  const { activeTab, setActiveTab, setCurrentScreen } = props;
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: "Assigned Tasks", desc: "Supervisor tasks & worker responses", icon: ListChecks, color: "#12B8A6", bg: "#E0F2F1", go: () => setCurrentScreen("assigned_tasks") },
    { label: "Add Supervisor", desc: "Create a supervisor account", icon: UserPlus, color: "#2563EB", bg: "#EFF6FF", go: () => setCurrentScreen("add_supervisor") },
    { label: "Compliance Sign-off", desc: "Validate CAPA closures", icon: ClipboardCheck, color: "#16A34A", bg: "#F0FDF4", go: () => setCurrentScreen("compliance_approvals") },
    { label: "Permit Approvals", desc: "Approve/reject work permits", icon: FileCheck2, color: "#8B5CF6", bg: "#FAF5FF", go: () => setCurrentScreen("permit_approvals") },
    { label: "Assign CAPA Actions", desc: "Assign corrective actions", icon: Wrench, color: "#F97316", bg: "#FFF7ED", go: () => setCurrentScreen("assign_actions") },
  ];

  const openTool = (go: () => void) => { setMenuOpen(false); go(); };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return <MgrMonitoring {...props} />;
      case 1: return <MgrRisk {...props} />;
      case 2: return <MgrPermits {...props} />;
      case 3: return <MgrComplaints {...props} />;
      case 4: return <Tab_Profile {...props} />;
      default: return <MgrMonitoring {...props} />;
    }
  };

  const tabs = [
    { label: "Monitoring", icon: LayoutGrid },
    { label: "Risk", icon: AlertTriangle },
    { label: "Permits", icon: ShieldCheck },
    { label: "Complaints", icon: MessageSquare },
    { label: "Profile", icon: User },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Menu size={22} color="#0B3D91" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>HSE Manager</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab(4)} activeOpacity={0.8}>
          <Avatar name={user?.name || "HSE Manager"} size={34} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentView}>{renderTabContent()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab, idx) => {
          const active = activeTab === idx;
          const Icon = tab.icon;
          return (
            <TouchableOpacity key={idx} style={styles.tabItem} onPress={() => setActiveTab(idx)}>
              <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                <Icon size={20} color={active ? "#FFFFFF" : "#A0AEC0"} />
              </View>
              <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ☰ Tools menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Manager Tools</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}><X size={20} color="#63739B" /></TouchableOpacity>
            </View>
            {menuItems.map((m) => {
              const Icon = m.icon;
              return (
                <TouchableOpacity key={m.label} style={styles.menuRow} onPress={() => openTool(m.go)} activeOpacity={0.8}>
                  <View style={[styles.menuIcon, { backgroundColor: m.bg }]}><Icon size={20} color={m.color} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{m.label}</Text>
                    <Text style={styles.menuDesc}>{m.desc}</Text>
                  </View>
                  <ChevronRight size={18} color="#A0AEC0" />
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  topBar: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 16,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  appTitle: { fontSize: 18, fontWeight: "800", color: "#0B3D91", letterSpacing: 0.3 },
  contentView: { flex: 1 },
  tabBar: {
    height: 64, flexDirection: "row", backgroundColor: "#FFFFFF",
    borderTopWidth: 1, borderColor: "#E2E8F0", paddingBottom: Platform.OS === "ios" ? 8 : 0, paddingTop: 6,
  },
  tabItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabIconWrap: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14 },
  tabIconWrapActive: { backgroundColor: "#2563EB" },
  tabLabel: { fontSize: 10, fontWeight: "600", color: "#A0AEC0", marginTop: 3 },
  activeTabLabel: { color: "#0B3D91", fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0B1C30" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "700", color: "#0B1C30" },
  menuDesc: { fontSize: 12, color: "#63739B", marginTop: 1 },
});

