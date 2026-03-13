import { getDeadlines } from "../api/api";

const LS_ENABLED_KEY = "deadline_notifications:enabled";
const LS_LAST_PREFIX = "deadline_notifications:last:"; // per opportunity id

export function areDeadlineNotificationsEnabled() {
  return localStorage.getItem(LS_ENABLED_KEY) === "true";
}

export function setDeadlineNotificationsEnabled(enabled) {
  localStorage.setItem(LS_ENABLED_KEY, enabled ? "true" : "false");
}

export async function ensureNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  try {
    return await Notification.requestPermission();
  } catch {
    return "default";
  }
}

function _getLastNotifiedAt(oppId) {
  const raw = localStorage.getItem(`${LS_LAST_PREFIX}${oppId}`);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function _setLastNotifiedAt(oppId, ts) {
  localStorage.setItem(`${LS_LAST_PREFIX}${oppId}`, String(ts));
}

function _safeId(opp) {
  return String(opp?._id || opp?.id || "");
}

function _buildTitle(opp) {
  const role = opp?.role || "Opportunity";
  return `Deadline soon: ${role}`;
}

function _buildBody(opp) {
  const company = opp?.company ? ` at ${opp.company}` : "";
  const deadline = opp?.deadline ? ` — ${opp.deadline}` : "";
  return `Application closing soon${company}${deadline}.`;
}

/**
 * Checks /deadline_soon and fires browser notifications for items.
 * - Only runs when enabled
 * - Only notifies once per opportunity per cooldown window
 * - Works only while the site is open (no push)
 */
export async function checkAndNotifyDeadlines({
  cooldownMs = 12 * 60 * 60 * 1000, // 12h
  maxPerRun = 3,
} = {}) {
  if (!areDeadlineNotificationsEnabled()) return { status: "disabled", sent: 0 };
  if (typeof Notification === "undefined") return { status: "unsupported", sent: 0 };
  if (Notification.permission !== "granted") return { status: "no_permission", sent: 0 };

  const now = Date.now();
  const items = await getDeadlines();
  const list = Array.isArray(items) ? items : [];

  let sent = 0;
  for (const opp of list) {
    if (sent >= maxPerRun) break;

    const oppId = _safeId(opp);
    if (!oppId) continue;

    const last = _getLastNotifiedAt(oppId);
    if (last && now - last < cooldownMs) continue;

    try {
      const n = new Notification(_buildTitle(opp), {
        body: _buildBody(opp),
        tag: `deadline_${oppId}`,
        renotify: false,
      });

      const link = opp?.link;
      if (link) {
        n.onclick = () => {
          try {
            window.focus();
            window.open(link, "_blank", "noreferrer");
          } catch {
            // ignore
          }
        };
      }

      _setLastNotifiedAt(oppId, now);
      sent += 1;
    } catch {
      // Some browsers throw if notifications aren't fully available
      return { status: "error", sent };
    }
  }

  return { status: "ok", sent };
}

