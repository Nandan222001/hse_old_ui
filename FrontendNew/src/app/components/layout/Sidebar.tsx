import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  House, BookOpenText, Users, CircleAlert, Briefcase,
  Lightbulb, ClipboardCheck, BarChart3, ChevronDown,
  FolderClosed, AlertTriangle, ListChecks, GitBranch,
  LogOut, Settings, X, Database, HardHat, MapPin,
  ShieldCheck, CalendarClock, TrendingUp, type LucideIcon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  name: string;
  icon: LucideIcon;
  path: string;
  /** When present the item expands into a submenu and `path` is the default
   *  destination clicking the parent navigates to. */
  children?: NavItem[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { name: "Home", icon: House, path: "/" },
      { name: "People", icon: Users, path: "/users" },
      { name: "Vendors", icon: HardHat, path: "/vendors" },
      { name: "Assets", icon: FolderClosed, path: "/equipment-certification" },
      { name: "Compliance", icon: ClipboardCheck, path: "/compliance" },
      {
        name: "Audits",
        icon: ShieldCheck,
        path: "/audits",
        children: [
          { name: "Register", icon: ListChecks, path: "/audits" },
          { name: "Programme", icon: CalendarClock, path: "/audits/programme" },
          { name: "Trends", icon: TrendingUp, path: "/audits/trends" },
          { name: "Templates", icon: BookOpenText, path: "/audits/templates" },
        ],
      },
      { name: "Risk", icon: CircleAlert, path: "/root-cause-analysis" },
      { name: "Work", icon: Briefcase, path: "/actions" },
      {
        name: "Incidents",
        icon: AlertTriangle,
        path: "/violations",
        children: [
          { name: "Overview", icon: ListChecks, path: "/violations" },
          { name: "Lifecycle Tracking", icon: GitBranch, path: "/incidents/tracking" },
        ],
      },
      { name: "Intelligence", icon: Lightbulb, path: "/ai-agent" },
      { name: "Checklists", icon: BookOpenText, path: "/checklists" },
      { name: "Reports", icon: BarChart3, path: "/analytics" },
      { name: "Data", icon: Database, path: "/data-management" },
      { name: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const orgLabel = (user?.companyName || user?.orgCode || "").trim();

  useEffect(() => {
    onCloseMobile?.();
  }, [location.pathname, onCloseMobile]);

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path.split("?")[0]);
  };

  // A parent counts as active when it or any of its children match, so the
  // group stays highlighted on a child route that lives under a different path.
  const isGroupActive = (item: NavItem) =>
    isActive(item.path) || (item.children?.some((child) => isActive(child.path)) ?? false);

  const visibleNavGroups = navGroups;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/35 transition-opacity duration-200 lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[250px] h-full flex flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: 'linear-gradient(180deg, #FCFDFF 0%, #F4F7FD 100%)',
          borderColor: '#E3E9F6',
        }}
      >

        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: '#E9EEF8' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                <img src="/logo.png" alt="HSE logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-[15px]" style={{ color: '#111827', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>HSE Intelligence</span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md lg:hidden"
              style={{ color: '#63739B' }}
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {orgLabel && (
            <div className="mt-2.5">
              <span
                className="inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-[10px]"
                style={{ background: '#E8EEFF', color: '#3E4FB1', fontWeight: 700 }}
                title={orgLabel}
              >
                {orgLabel}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {visibleNavGroups.map((group) => (
          <div key={group.label ?? "main-nav"}>
            {group.label && (
              <div className="px-3 py-1">
                <span className="text-[10px] tracking-[1.1px] uppercase" style={{ color: '#94A3B8', fontWeight: 700 }}>
                  {group.label}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const groupActive = isGroupActive(item);
                const active = item.children ? groupActive && !item.children.some((c) => isActive(c.path)) : groupActive;
                const isHovered = hovered === item.name;
                const expanded = item.children ? (openMenu === item.name || groupActive) : false;

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => {
                        if (item.children) {
                          // Expand and land on the first child, so one click
                          // always reaches a page rather than only toggling.
                          setOpenMenu(expanded && !groupActive ? null : item.name);
                        }
                        navigate(item.path);
                        onCloseMobile?.();
                      }}
                      onMouseEnter={() => setHovered(item.name)}
                      onMouseLeave={() => setHovered(null)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                      aria-expanded={item.children ? expanded : undefined}
                      style={active ? {
                        background: 'linear-gradient(135deg, #4A57B9 0%, #6F80E8 100%)',
                        boxShadow: '0 6px 16px rgba(79, 94, 190, 0.28)',
                      } : {
                        background: isHovered || (item.children && groupActive) ? '#EEF2FB' : 'transparent',
                      }}
                    >
                      <item.icon
                        className="w-[17px] h-[17px] flex-shrink-0"
                        style={{ color: active ? '#ffffff' : '#7C869C' }}
                      />
                      <span
                        className="text-[13px] flex-1 text-left"
                        style={{ color: active ? '#ffffff' : '#2F3A4F', fontWeight: active || groupActive ? 600 : 500 }}
                      >
                        {item.name}
                      </span>
                      {item.children && (
                        <ChevronDown
                          className="w-[14px] h-[14px] flex-shrink-0 transition-transform duration-200"
                          style={{
                            color: active ? '#ffffff' : '#9AA5BC',
                            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          }}
                        />
                      )}
                    </button>

                    {item.children && expanded && (
                      <div className="mt-0.5 ml-[26px] space-y-0.5 border-l pl-2" style={{ borderColor: '#E1E8F6' }}>
                        {item.children.map((child) => {
                          const childActive = isActive(child.path);
                          const childHovered = hovered === `${item.name}/${child.name}`;
                          return (
                            <button
                              key={child.name}
                              onClick={() => {
                                navigate(child.path);
                                onCloseMobile?.();
                              }}
                              onMouseEnter={() => setHovered(`${item.name}/${child.name}`)}
                              onMouseLeave={() => setHovered(null)}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200"
                              style={{
                                background: childActive ? '#E4EAFC' : childHovered ? '#F1F5FE' : 'transparent',
                              }}
                            >
                              <child.icon
                                className="w-[14px] h-[14px] flex-shrink-0"
                                style={{ color: childActive ? '#3E4FB1' : '#94A0B8' }}
                              />
                              <span
                                className="text-[12px] flex-1 text-left"
                                style={{ color: childActive ? '#2C3A8C' : '#4B5670', fontWeight: childActive ? 600 : 500 }}
                              >
                                {child.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t" style={{ borderColor: '#E4EAF7' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #505AB6, #7890F6)', fontWeight: 700 }}>
            {user?.initials || "US"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] truncate" style={{ color: '#111827', fontWeight: 600 }}>{user?.name || "User"}</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full uppercase" style={{ background: '#E8EEFF', color: '#3E4FB1', fontWeight: 700 }}>
              {user?.role || "Admin"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: '#F4F7FF' }}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" style={{ color: '#63739B' }} />
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
