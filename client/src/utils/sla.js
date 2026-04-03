// SLA utilities: duration formatting and SLA computation
export const SLA_HOURS = 48;

export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Compute SLA info for a complaint object. Returns { elapsedMs, remainingMs, slaMs, overdue }
export function computeSLA(complaint, slaHours = SLA_HOURS) {
  const slaMs = slaHours * 60 * 60 * 1000;
  if (!complaint || !complaint.createdAt) {
    return { elapsedMs: 0, remainingMs: slaMs, slaMs, overdue: false };
  }
  const created = new Date(complaint.createdAt).getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - created);
  const remainingMs = Math.max(0, slaMs - elapsedMs);
  const overdue = elapsedMs > slaMs;
  return { elapsedMs, remainingMs, slaMs, overdue };
}

export default { SLA_HOURS, formatDuration, computeSLA };
