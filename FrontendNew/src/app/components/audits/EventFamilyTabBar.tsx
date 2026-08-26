import { useLocation, useNavigate } from "react-router";
import { AlertTriangle, Eye, FileCheck2, ShieldAlert, Siren } from "lucide-react";

const FAMILIES = [
  { name: "Incidents", icon: AlertTriangle, path: "/violations", prefixes: ["/violations", "/incidents"] },
  { name: "Hazards", icon: Siren, path: "/hazards", prefixes: ["/hazards"] },
  { name: "Permits", icon: FileCheck2, path: "/permits/tracking", prefixes: ["/permits"] },
  { name: "Near Miss", icon: Eye, path: "/near-miss", prefixes: ["/near-miss"] },
  { name: "Unsafe Act", icon: ShieldAlert, path: "/unsafe-acts", prefixes: ["/unsafe-acts"] },
];

/**
 * Switches between the five eight-stage-lifecycle families — Incidents,
 * Hazards, Permits, Near Miss, Unsafe Act. Mounted on every page in all five
 * families (not just Incidents') so it stays on screen across the switch
 * instead of disappearing the moment you leave Incidents; each family's own
 * Overview/Lifecycle-Tracking split (IncidentsTabBar, HazardsTabBar,
 * NearMissTabBar, UnsafeActTabBar) sits in its own row underneath this one.
 */
export function EventFamilyTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {FAMILIES.map((family) => {
        const active = family.prefixes.some((p) => location.pathname.startsWith(p));
        return (
          <button
            key={family.name}
            type="button"
            onClick={() => navigate(family.path)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors"
            style={{
              background: active ? "#4A57B9" : "#F1F5F9",
              color: active ? "#FFFFFF" : "#475569",
              fontWeight: active ? 700 : 500,
            }}
          >
            <family.icon className="h-3.5 w-3.5" />
            {family.name}
          </button>
        );
      })}
    </div>
  );
}
