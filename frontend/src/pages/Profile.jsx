import { Link } from "react-router-dom";
import { User, Briefcase, CheckCircle2, Clock, History } from "lucide-react";
import { useEffect, useState } from "react";
import {
  areDeadlineNotificationsEnabled,
  ensureNotificationPermission,
  setDeadlineNotificationsEnabled,
} from "../utils/deadlineNotifications";

export default function Profile({ user }) {
  const skills = user?.skills || [];
  const batch = user?.batch;
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifStatus, setNotifStatus] = useState("");

  useEffect(() => {
    setNotifEnabled(areDeadlineNotificationsEnabled());
    if (typeof Notification !== "undefined") {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const toggleNotifications = async (next) => {
    if (!next) {
      setDeadlineNotificationsEnabled(false);
      setNotifEnabled(false);
      return;
    }

    const perm = await ensureNotificationPermission();
    setNotifStatus(perm);
    if (perm === "granted") {
      setDeadlineNotificationsEnabled(true);
      setNotifEnabled(true);
    } else {
      setDeadlineNotificationsEnabled(false);
      setNotifEnabled(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary">Your profile</h1>
        <p className="text-sm text-textSecondary">
          Your details and extracted skills are used to match you with eligible internships and deadlines.
        </p>
      </div>

      {/* Basic details */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">{user?.name || "User"}</h2>
            <p className="text-sm text-textSecondary">{user?.email}</p>
          </div>
        </div>
        {batch && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-textSecondary">Batch:</span>
            <span className="font-medium text-textPrimary">{batch}</span>
          </div>
        )}
      </div>

      {/* Extracted skills */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-textPrimary flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Extracted skills
        </h2>
        <p className="text-sm text-textSecondary">
          These skills were extracted from your resume and are used to find eligible opportunities, deadlines, and matches.
        </p>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-textSecondary">
            No skills on file. Complete onboarding and upload your resume to extract skills.
          </p>
        )}
      </div>

      {/* How we use your profile */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-textPrimary">How we use your profile</h2>
        <ul className="space-y-3 text-sm text-textSecondary">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-textPrimary">Eligible</strong> — We compare your skills with each opportunity’s requirements and show you the ones you qualify for.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-textPrimary">Deadlines</strong> — Upcoming deadlines are shown so you don’t miss applications.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <History className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-textPrimary">Match history</strong> — All past matches between your profile and opportunities are stored for reference.
            </span>
          </li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            to="/eligible"
            className="text-sm font-medium text-primary hover:underline"
          >
            View eligible opportunities →
          </Link>
          <Link
            to="/deadlines"
            className="text-sm font-medium text-primary hover:underline"
          >
            View deadlines →
          </Link>
          <Link
            to="/matches"
            className="text-sm font-medium text-primary hover:underline"
          >
            View match history →
          </Link>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-textPrimary">Deadline notifications</h2>
            <p className="text-sm text-textSecondary">
              Get a Chrome notification when an opportunity is near its deadline (works while this site is open).
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleNotifications(!notifEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
              notifEnabled ? "bg-primary/70 border-primary/40" : "bg-slate-900 border-border/60"
            }`}
            aria-pressed={notifEnabled}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                notifEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {typeof Notification === "undefined" ? (
          <div className="text-xs text-textSecondary">
            Notifications aren’t supported in this browser.
          </div>
        ) : notifStatus === "denied" ? (
          <div className="text-xs text-textSecondary">
            Notifications are blocked in your browser settings. Allow notifications for this site to enable alerts.
          </div>
        ) : null}
      </div>
    </div>
  );
}
