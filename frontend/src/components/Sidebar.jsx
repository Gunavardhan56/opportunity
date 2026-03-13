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
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-border">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="text-lg font-semibold text-textPrimary">
          Opportunity Intel
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
                    ? "bg-primary text-white"
                    : "text-textSecondary hover:bg-slate-100"
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

