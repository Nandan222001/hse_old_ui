import { useState, useEffect } from "react";
import { StyleSheet, View, Text, Animated } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";

// Mock Data
import {
  INITIAL_INCIDENTS,
  INITIAL_PERMITS,
  INITIAL_COMPLAINTS,
  INITIAL_CAPA,
  INITIAL_AUDITS,
  type Incident,
  type Capa,
} from "./data/mockData";

// Types
import type { ScreenProps } from "./components/types";

// Screens
import { LoginScreenView } from "./components/LoginScreen";
import { InvestigationScreenView } from "./components/InvestigationScreen";
import { AssignActionsScreenView } from "./components/AssignActionsScreen";
import { ComplianceApprovalsView } from "./components/ComplianceApprovals";
import { PermitApprovalsView } from "./components/PermitApprovals";
import { AppContainerView } from "./components/AppContainer";

export function ManagerAppRoot() {
  const { logout } = useAuth();

  // Navigation & Layout States - Start with "app" directly instead of "login"
  const [currentScreen, setCurrentScreen] = useState<
    "login" | "app" | "investigation" | "assign_actions" | "compliance_approvals" | "permit_approvals"
  >("app");
  const [layoutVersion] = useState<"A" | "B">("B");
  const [activeTab, setActiveTab] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [toastAnim] = useState(new Animated.Value(0));

  // App Functional States
  const [employeeId, setEmployeeId] = useState("8842-TX");
  const [password, setPassword] = useState("password");

  // Data States
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [permits, setPermits] = useState(INITIAL_PERMITS);
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [capaItems, setCapaItems] = useState(INITIAL_CAPA);
  const [audits, setAudits] = useState(INITIAL_AUDITS);

  // Search & Filter
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintFilter, setComplaintFilter] = useState("All");

  // Form/Flow States (Investigation & Action Assignment)
  const [selectedIncident, setSelectedIncident] = useState<Incident>(INITIAL_INCIDENTS[0]);
  const [whys, setWhys] = useState({
    why1: "Containment drum seal failed during transport.",
    why2: "Drum was subjected to excessive mechanical vibration.",
    why3: "Tie-down straps on the transport pallet were loose.",
    why4: "Pre-transport checklist was skipped by the loading crew.",
    why5: "Lack of supervisor validation on high-risk transport departures.",
  });
  const [rcaDone, setRcaDone] = useState(false);

  // Corrective Actions Assignment Form
  const [actionDesc, setActionDesc] = useState("");
  const [actionPriority, setActionPriority] = useState<"Critical" | "High" | "Medium" | "Low">("High");
  const [actionDueDate, setActionDueDate] = useState("2026-07-25");
  const [actionAssignee, setActionAssignee] = useState("");
  const [actionCompliance, setActionCompliance] = useState(true);
  const [queuedActions, setQueuedActions] = useState<Omit<Capa, "id" | "status">[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Sign out redirect
  useEffect(() => {
    if (currentScreen === "login") {
      logout();
    }
  }, [currentScreen, logout]);

  const showToast = (msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  };

  const handleAIDraft = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      if (selectedIncident.id === "INC-9022") {
        setWhys({
          why1: "Containment drum seal failed during transport.",
          why2: "Drum was subjected to excessive mechanical vibration.",
          why3: "Tie-down straps on the transport pallet were loose.",
          why4: "Pre-transport checklist was skipped by the loading crew.",
          why5: "Lack of supervisor validation on high-risk transport departures.",
        });
      } else if (selectedIncident.id === "INC-9024") {
        setWhys({
          why1: "Exposed wires touched the metal housing of panel Line 3.",
          why2: "Insulating cover degraded over time due to high ambient heat.",
          why3: "Scheduled thermal scan maintenance was deferred last month.",
          why4: "Maintenance scheduler was overloaded and missed the ticket.",
          why5: "Maintenance backlog routing lacks automated high-severity alerts.",
        });
      } else {
        setWhys({
          why1: "Forklift driver swerved abruptly near the walkway.",
          why2: "Pedestrian stepped into the vehicle path unexpectedly.",
          why3: "Pedestrian was distracted by a phone notification.",
          why4: "Walkway has no physical barriers or audio warnings.",
          why5: "Safety layout plan lacks segregation rules for active vehicle lanes.",
        });
      }
      setIsGeneratingAI(false);
      showToast("5 Whys drafted by AI");
    }, 700);
  };

  const handleQueueAction = () => {
    if (!actionDesc.trim()) {
      showToast("Please enter an action description");
      return;
    }
    if (!actionAssignee.trim()) {
      showToast("Please enter an assignee");
      return;
    }

    const newAction: Omit<Capa, "id" | "status"> = {
      desc: actionDesc,
      priority: actionPriority,
      dueDate: actionDueDate,
      assignee: actionAssignee,
      complianceChecked: !actionCompliance, // if sign-off not required, set complianceChecked=true
    };

    setQueuedActions((prev) => [...prev, newAction]);
    showToast("Action added to queue");

    // Reset input fields
    setActionDesc("");
    setActionAssignee("");
  };

  const handleFinalizeActions = () => {
    if (queuedActions.length === 0) return;

    const newCapaItems: Capa[] = queuedActions.map((action) => ({
      id: `CAPA-${Math.floor(1000 + Math.random() * 9000)}`,
      desc: action.desc,
      priority: action.priority,
      status: "Open",
      dueDate: action.dueDate,
      assignee: action.assignee,
      complianceChecked: action.complianceChecked,
    }));

    setCapaItems((prev) => [...newCapaItems, ...prev]);

    // Update incident status to closed
    setIncidents((prev) =>
      prev.map((i) => (i.id === selectedIncident.id ? { ...i, status: "CLOSED" } : i))
    );

    setQueuedActions([]);
    showToast(`${newCapaItems.length} corrective actions assigned & incident closed`);
    setCurrentScreen("app");
  };

  const sharedProps: ScreenProps = {
    currentScreen,
    setCurrentScreen,
    layoutVersion,
    activeTab,
    setActiveTab,
    employeeId,
    setEmployeeId,
    password,
    setPassword,
    incidents,
    setIncidents,
    permits,
    setPermits,
    complaints,
    setComplaints,
    capaItems,
    setCapaItems,
    audits,
    setAudits,
    complaintSearch,
    setComplaintSearch,
    complaintFilter,
    setComplaintFilter,
    selectedIncident,
    setSelectedIncident,
    whys,
    setWhys,
    rcaDone,
    setRcaDone,
    actionDesc,
    setActionDesc,
    actionPriority,
    setActionPriority,
    actionDueDate,
    setActionDueDate,
    actionAssignee,
    setActionAssignee,
    actionCompliance,
    setActionCompliance,
    queuedActions,
    setQueuedActions,
    showToast,
    isGeneratingAI,
    handleAIDraft,
    handleQueueAction,
    handleFinalizeActions,
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return <LoginScreenView {...sharedProps} />;
      case "investigation":
        return <InvestigationScreenView {...sharedProps} />;
      case "assign_actions":
        return <AssignActionsScreenView {...sharedProps} />;
      case "compliance_approvals":
        return <ComplianceApprovalsView {...sharedProps} />;
      case "permit_approvals":
        return <PermitApprovalsView {...sharedProps} />;
      case "app":
      default:
        return <AppContainerView {...sharedProps} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.appContainer}>
        {renderScreen()}

        {/* Toast Alert Banner */}
        {toast && (
          <Animated.View
            style={[
              styles.toastBanner,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.toastDot} />
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  toastBanner: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "#0B3D91",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  toastDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
