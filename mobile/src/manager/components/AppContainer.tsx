import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Shield,
  MessageSquare,
  LogOut,
} from "lucide-react-native";
import type { ScreenProps } from "./types";

// Import tabs
import { TabB_SafetyPerformance } from "./tabs/TabB_SafetyPerformance";
import { TabB_Risks } from "./tabs/TabB_Risks";
import { TabB_CapaOverview } from "./tabs/TabB_CapaOverview";
import { Tab_PermitMonitoring } from "./tabs/Tab_PermitMonitoring";
import { TabA_Complaints } from "./tabs/TabA_Complaints";

export function AppContainerView(props: ScreenProps) {
  const { activeTab, setActiveTab, setCurrentScreen, showToast } = props;

  const handleSignOut = () => {
    setCurrentScreen("login");
    showToast("Signed out successfully");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <TabB_SafetyPerformance {...props} />;
      case 1:
        return <TabB_Risks {...props} />;
      case 2:
        return <TabB_CapaOverview {...props} />;
      case 3:
        return <Tab_PermitMonitoring {...props} />;
      case 4:
        return <TabA_Complaints {...props} />;
      default:
        return <TabB_SafetyPerformance {...props} />;
    }
  };

  const tabs = [
    { label: "Safety", icon: Activity },
    { label: "Hazards", icon: AlertTriangle },
    { label: "CAPA", icon: ClipboardList },
    { label: "Permits", icon: Shield },
    { label: "Feedback", icon: MessageSquare },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Shield size={20} color="#0B3D91" style={{ marginRight: 6 }} />
          <Text style={styles.appTitle}>HSE Portal</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={18} color="#63739B" />
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
            <TouchableOpacity
              key={idx}
              style={styles.tabItem}
              onPress={() => setActiveTab(idx)}
            >
              <Icon size={20} color={active ? "#0B3D91" : "#A0AEC0"} />
              <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B3D91",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    padding: 8,
  },
  contentView: {
    flex: 1,
  },
  tabBar: {
    height: 60,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    paddingBottom: Platform.OS === "ios" ? 10 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#A0AEC0",
    marginTop: 4,
  },
  activeTabLabel: {
    color: "#0B3D91",
    fontWeight: "700",
  },
});
