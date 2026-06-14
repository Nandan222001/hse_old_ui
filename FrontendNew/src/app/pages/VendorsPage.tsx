import { VendorSidebarDashboard } from "../components/dashboard/VendorSidebarDashboard";
import { useAuth } from "../context/AuthContext";

export function VendorsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <VendorSidebarDashboard currentUserName={user?.name} />
    </div>
  );
}
