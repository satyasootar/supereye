export const ANALYTICS_WINDOW_DAYS = 30;

export function normalizeDayKey(day: string): string {
  return day.slice(0, 10);
}

/** Fill missing days with zero so charts always render a full timeline. */
export function fillDailySeries(
  points: { day: string; value: number }[],
  days = ANALYTICS_WINDOW_DAYS
): { day: string; value: number }[] {
  const map = new Map<string, number>();
  for (const point of points) {
    map.set(normalizeDayKey(point.day), point.value);
  }

  const result: { day: string; value: number }[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ day: key, value: map.get(key) ?? 0 });
  }

  return result;
}

export function seriesHasActivity(points: { value: number }[]): boolean {
  return points.some((point) => point.value > 0);
}

export function formatChartDayLabel(day: string): string {
  return new Date(`${normalizeDayKey(day)}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
