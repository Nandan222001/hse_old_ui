import { Search, Bell, ChevronDown, ChevronRight, Moon, Sun, LogOut, FileBarChart, Settings as SettingsIcon, BarChart3, History, Sparkles, ExternalLink, Users, Database, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useState, useRef, useEffect } from "react";

const breadcrumbMap: Record<string, string> = {
  "/": "Dashboard",
  "/violations": "Incidents",
  "/near-miss": "Near By",
  "/actions": "Work",
  "/checklists": "Daily Checklists",
  "/compliance": "Compliance",
  "/sites-zones": "Sites & Zones",
  "/cameras-devices": "Cameras & Devices",
  "/policies": "Policies & Rules",
  "/users": "Users",
  "/ai-agent": "AI Agent",
  "/analytics": "Analytics",
  "/billing": "Billing",
  "/notifications": "Notifications",
  "/engagement": "Engagement",
  "/equipment-certification": "Assets",
  "/root-cause-analysis": "Risk",
  "/settings": "System Settings",
};

interface TopNavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSidebar: () => void;
}

export function TopNavbar({ darkMode, onToggleDarkMode, onOpenSidebar }: TopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, subscriptionPlan, setSubscriptionPlan } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentPage = breadcrumbMap[location.pathname] || "Dashboard";
  const orgLabel = (user?.companyName || user?.orgCode || "").trim();
  const isFreePlan = subscriptionPlan === "Free";

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSubscriptionMenu, setShowSubscriptionMenu] = useState(false);
  const reportsMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const subscriptionMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (reportsMenuRef.current && !reportsMenuRef.current.contains(e.target as Node)) {
        setShowReportsMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (subscriptionMenuRef.current && !subscriptionMenuRef.current.contains(e.target as Node)) {
        setShowSubscriptionMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="min-h-16 flex items-center gap-3 px-3 py-2 sm:px-4 md:px-6 border-b bg-card" style={{ borderColor: darkMode ? '#1E3663' : '#DBE7FF' }}>
      <button
        type="button"
        onClick={onOpenSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
        style={{ background: darkMode ? '#172846' : '#F3F7FF', color: darkMode ? '#AFC4EE' : '#4A5568' }}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb */}
      <div className="hidden items-center gap-1.5 text-[13px] md:flex" style={{ color: '#9CA3AF' }}>
        <span>HSE Intelligence</span>
        {orgLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: darkMode ? '#11387D' : '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 600,
              }}
            >
              {orgLabel}
            </span>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span style={{ color: darkMode ? '#EEF4FF' : '#0A0A0A', fontWeight: 500 }}>{currentPage}</span>
      </div>

      {/* Search */}
      <div className="hidden flex-1 justify-center px-4 lg:flex xl:px-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#1D4ED8' }} />
          <input
            type="text"
            placeholder="Search violations, zones, users..."
            className="w-full h-10 pl-10 pr-4 rounded-lg text-[13px] border transition-all"
            style={{
              background: darkMode ? '#132647' : '#F3F7FF',
              borderColor: darkMode ? '#1E3663' : '#DBE7FF',
              color: darkMode ? '#EEF4FF' : '#0A0A0A',
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Subscription Dropdown */}
        <div className="relative hidden sm:block" ref={subscriptionMenuRef}>
          {isFreePlan ? (
            <button
              onClick={() => navigate(`/auth/onboarding/form?upgrade=1&target_plan=${encodeURIComponent(subscriptionPlan)}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-[13px] font-semibold"
              style={{
                background: 'linear-gradient(135deg, #0B3D91, #3B82F6)',
                color: '#ffffff',
                boxShadow: '0 2px 4px rgba(11, 61, 145, 0.25)'
              }}
            >
              <Sparkles className="w-4 h-4" />
              Upgrade
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] uppercase"
              style={{
                background: darkMode ? '#11387D' : '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 700,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {subscriptionPlan}
            </span>
          )}
          {showSubscriptionMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border py-2 z-50 overflow-hidden"
              style={{
                background: darkMode ? '#111811' : '#ffffff',
                borderColor: darkMode ? '#1E2E1E' : '#E2E8E2',
              }}
            >
              <div className="px-4 py-2 border-b" style={{ borderColor: darkMode ? '#1E2E1E' : '#E2E8E2' }}>
                <h3 className="text-[14px] font-bold" style={{ color: darkMode ? '#F0F4F0' : '#0A0A0A' }}>Subscription Plans</h3>
              </div>

              <div className="p-2 space-y-1">
                {/* Free Plan */}
                <button
                  onClick={() => { setSubscriptionPlan("Free"); setShowSubscriptionMenu(false); navigate("/subscription"); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-[#1A241A] border border-transparent hover:border-gray-200 dark:hover:border-[#2E422E] ${subscriptionPlan === "Free" ? "bg-gray-50 border-gray-200 dark:bg-[#1A241A] dark:border-[#2E422E]" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[13px] font-bold" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>Free</span>
                    {subscriptionPlan === "Free" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1E2E1E] text-gray-600 dark:text-gray-300">Current</span>}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Limited usage across all modules.</p>
                </button>

                {/* Pro Plan */}
                <button
                  onClick={() => { setSubscriptionPlan("Pro"); setShowSubscriptionMenu(false); navigate("/subscription"); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-[#0F1C38] border border-transparent hover:border-gray-200 dark:hover:border-[#2A467A] ${subscriptionPlan === "Pro" ? "bg-blue-50 border-blue-200 dark:bg-[#102A52] dark:border-[#2A4F87]" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[13px] font-bold" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>Pro</span>
                    {subscriptionPlan === "Pro" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Current</span>}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">10x more usage. All options enabled.</p>
                </button>

                {/* Enterprise Plan */}
                <button
                  onClick={() => { setSubscriptionPlan("Enterprise"); setShowSubscriptionMenu(false); navigate("/subscription"); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-[#0F1C38] border border-transparent hover:border-gray-200 dark:hover:border-[#2A467A] ${subscriptionPlan === "Enterprise" ? "bg-blue-50 border-blue-200 dark:bg-[#102A52] dark:border-[#2A4F87]" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[13px] font-bold" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>Enterprise</span>
                    {subscriptionPlan === "Enterprise" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Current</span>}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Customization & unlimited usage.</p>
                </button>

                <div className="mt-2 pt-2 border-t" style={{ borderColor: darkMode ? '#1E2E1E' : '#E2E8E2' }}>
                  <a
                    href="https://theta-ai-website.vercel.app/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowSubscriptionMenu(false)}
                    className="w-full text-center px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-[#1A241A] flex items-center justify-center gap-1.5"
                  >
                    <span className="text-[12px] font-medium" style={{ color: '#1D4ED8' }}>Contact Sales</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reports Dropdown */}
        <div className="relative hidden lg:block" ref={reportsMenuRef}>
          <button
            onClick={() => setShowReportsMenu(!showReportsMenu)}
            className="flex items-center gap-1.5 p-2 rounded-lg transition-colors hover:bg-[#F3F7FF] text-[13px] font-medium text-gray-700"
            style={darkMode ? { color: '#F0F4F0' } : {}}
          >
            <FileBarChart className="w-[18px] h-[18px]" style={{ color: darkMode ? '#AFC4EE' : '#4A5568' }} />
            Reports
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showReportsMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border py-2 z-50"
              style={{
                background: darkMode ? '#111811' : '#ffffff',
                borderColor: darkMode ? '#1E2E1E' : '#E2E8E2',
              }}
            >
              <button onClick={() => { navigate("/analytics"); setShowReportsMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 dark:hover:bg-[#1A241A]" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>
                <BarChart3 className="w-4 h-4" /> Analytics
              </button>
              <button onClick={() => { navigate("/analytics?tab=reports"); setShowReportsMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 dark:hover:bg-[#1A241A]" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>
                <FileBarChart className="w-4 h-4" /> Reports
              </button>
              <button onClick={() => { navigate("/compliance?tab=audit"); setShowReportsMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 dark:hover:bg-[#1A241A]" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>
                <History className="w-4 h-4" /> Audit Trail
              </button>
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <div className="relative hidden lg:block" ref={settingsMenuRef}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="flex items-center gap-1.5 p-2 rounded-lg transition-colors hover:bg-[#F3F7FF] text-[13px] font-medium text-gray-700"
            style={darkMode ? { color: '#F0F4F0' } : {}}
          >
            <SettingsIcon className="w-[18px] h-[18px]" style={{ color: darkMode ? '#AFC4EE' : '#4A5568' }} />
            Settings
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showSettingsMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border py-2 z-50"
              style={{
                background: darkMode ? '#111811' : '#ffffff',
                borderColor: darkMode ? '#1E2E1E' : '#E2E8E2',
              }}
            >
              <button onClick={() => { navigate("/users?tab=handle-users"); setShowSettingsMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 dark:hover:bg-[#1A241A]" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>
                <Users className="w-4 h-4" /> Handle Users
              </button>
              <button onClick={() => { navigate("/users?tab=knowledge-base"); setShowSettingsMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 dark:hover:bg-[#1A241A]" style={{ color: darkMode ? '#F0F4F0' : '#4A5568' }}>
                <Database className="w-4 h-4" /> Knowledge Base
              </button>
            </div>
          )}
        </div>

        <div className="hidden h-6 w-px mx-1 md:block" style={{ background: darkMode ? '#1E3663' : '#DBE7FF' }} />

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg transition-colors hover:bg-[#F3F7FF]"
          style={darkMode ? { background: '#172846' } : {}}
        >
          {darkMode ? <Sun className="w-4 h-4" style={{ color: '#93C5FD' }} /> : <Moon className="w-4 h-4" style={{ color: '#4A5568' }} />}
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg transition-colors hover:bg-[#F3F7FF]" style={darkMode ? { background: '#172846' } : {}}>
          <Bell className="w-[18px] h-[18px]" style={{ color: darkMode ? '#AFC4EE' : '#4A5568' }} />
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] flex items-center justify-center" style={{ fontWeight: 600 }}>
            3
          </span>
        </button>

        {/* Separator */}
        <div className="hidden h-8 w-px sm:block" style={{ background: darkMode ? '#1E3663' : '#DBE7FF' }} />

        {/* User */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px]" style={{ background: 'linear-gradient(135deg, #0B3D91, #3B82F6)', fontWeight: 600 }}>
              {user?.initials || "JD"}
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full uppercase" style={{ background: darkMode ? '#11387D' : '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
              {user?.role || "Admin"}
            </span>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
          </div>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border py-2 z-50"
              style={{
                background: darkMode ? '#111811' : '#ffffff',
                borderColor: darkMode ? '#1E2E1E' : '#E2E8E2',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: darkMode ? '#1E2E1E' : '#E2E8E2' }}>
                <div className="text-[13px]" style={{ color: darkMode ? '#F0F4F0' : '#0A0A0A', fontWeight: 500 }}>
                  {user?.name || "User"}
                </div>
                <div className="text-[12px]" style={{ color: '#9CA3AF' }}>
                  {user?.email || "user@organization.com"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-red-50"
                style={{ color: '#DC2626' }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
