export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function formatDuration(seconds: number | null | undefined): string {
  const total = Math.max(0, seconds ?? 0);
  if (total < 60) return `${total}s`;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (secs > 0) return `${minutes}m ${secs}s`;
  return `${minutes}m`;
}

export function isRecentlyOnline(
  lastHeartbeatAt: Date | string | null | undefined,
  now = Date.now()
): boolean {
  if (!lastHeartbeatAt) return false;
  const ts = typeof lastHeartbeatAt === 'string' ? Date.parse(lastHeartbeatAt) : lastHeartbeatAt.getTime();
  if (Number.isNaN(ts)) return false;
  return now - ts <= ONLINE_THRESHOLD_MS;
}

export function sessionDurationSeconds(
  startedAt: Date | string,
  lastHeartbeatAt: Date | string,
  endedAt?: Date | string | null,
  now = Date.now()
): number {
  const start = typeof startedAt === 'string' ? Date.parse(startedAt) : startedAt.getTime();
  const endSource = endedAt ?? lastHeartbeatAt;
  const end = typeof endSource === 'string' ? Date.parse(endSource) : endSource.getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((Math.min(end, now) - start) / 1000));
}
