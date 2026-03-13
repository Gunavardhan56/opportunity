import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Clock,
  History,
  User,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/eligible", label: "Eligible", icon: CheckCircle2 },
  { to: "/deadlines", label: "Deadlines", icon: Clock },
  { to: "/matches", label: "Match History", icon: History },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-[#020617] border-r border-border/60">
      <div className="h-16 flex items-center px-6 border-b border-border/60">
        <div className="text-lg font-semibold text-textPrimary tracking-tight">
          OpptIntel
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/90 text-white shadow-lg shadow-primary/40"
                    : "text-textSecondary hover:bg-slate-800/70"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

