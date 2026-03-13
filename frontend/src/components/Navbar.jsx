import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <header className="h-16 border-b border-border/60 bg-[#020617]/90 backdrop-blur flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 w-full md:w-1/2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search opportunities..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-[#020617] placeholder:text-textSecondary/60"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-textSecondary hover:text-textPrimary">
          <Bell className="w-5 h-5" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg hover:bg-slate-800/70 p-1 -mr-1 transition-colors"
            aria-expanded={open}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shadow-lg shadow-primary/40">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-textPrimary">
                {user?.name || "User"}
              </span>
              <span className="text-xs text-textSecondary">
                {user?.email || "Welcome back"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-textSecondary hidden md:block transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg border border-border/60 bg-[#020617] shadow-xl shadow-black/40 py-1 z-50">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-textPrimary hover:bg-slate-800/70"
              >
                <User className="w-4 h-4 text-textSecondary" />
                View profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-textPrimary hover:bg-slate-800/70"
              >
                <LogOut className="w-4 h-4 text-textSecondary" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

