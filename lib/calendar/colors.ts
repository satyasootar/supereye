export const GOOGLE_EVENT_COLOR_CLASSES: Record<string, string> = {
  '1': 'bg-[#a4bdfc]/25 text-[#2b428d] border border-[#a4bdfc]/50 dark:bg-[#a4bdfc]/15 dark:text-[#a4bdfc] dark:border-[#a4bdfc]/30',
  '2': 'bg-[#7ae7bf]/30 text-[#124d35] border border-[#7ae7bf]/60 dark:bg-[#7ae7bf]/15 dark:text-[#7ae7bf] dark:border-[#7ae7bf]/30',
  '3': 'bg-[#dbadff]/30 text-[#541f87] border border-[#dbadff]/60 dark:bg-[#dbadff]/15 dark:text-[#dbadff] dark:border-[#dbadff]/30',
  '4': 'bg-[#ff887c]/25 text-[#911f15] border border-[#ff887c]/50 dark:bg-[#ff887c]/15 dark:text-[#ff887c] dark:border-[#ff887c]/30',
  '5': 'bg-[#fbd75b]/35 text-[#735600] border border-[#fbd75b]/60 dark:bg-[#fbd75b]/15 dark:text-[#fbd75b] dark:border-[#fbd75b]/30',
  '6': 'bg-[#ffb878]/30 text-[#854505] border border-[#ffb878]/50 dark:bg-[#ffb878]/15 dark:text-[#ffb878] dark:border-[#ffb878]/30',
  '7': 'bg-[#46d6db]/25 text-[#05575a] border border-[#46d6db]/50 dark:bg-[#46d6db]/15 dark:text-[#46d6db] dark:border-[#46d6db]/30',
  '8': 'bg-[#e1e1e1]/40 text-[#3a3a3a] border border-[#e1e1e1]/70 dark:bg-[#e1e1e1]/15 dark:text-[#e1e1e1] dark:border-[#e1e1e1]/30',
  '9': 'bg-[#5484ed]/20 text-[#1c3c8a] border border-[#5484ed]/40 dark:bg-[#5484ed]/15 dark:text-[#5484ed] dark:border-[#5484ed]/30',
  '10': 'bg-[#51b749]/25 text-[#1a5215] border border-[#51b749]/50 dark:bg-[#51b749]/15 dark:text-[#51b749] dark:border-[#51b749]/30',
  '11': 'bg-[#dc2127]/20 text-[#8c0e12] border border-[#dc2127]/40 dark:bg-[#dc2127]/15 dark:text-[#dc2127] dark:border-[#dc2127]/30',
};

const CYCLE_COLOR_IDS = ['9', '10', '4', '5', '3'];

const HOLIDAY_KEYWORDS = [
  'christmas',
  'new year',
  'holiday',
  'pongal',
  'sankranti',
  'panchami',
  'ramadan',
  'jayanti',
  'buddha',
  'purnima',
];

const CELEBRATION_KEYWORDS = ['anniversary', 'birthday', 'hackathon'];

export function getEventColorClasses(
  colorId: string | undefined,
  index: number,
  summary?: string
): string {
  if (colorId && GOOGLE_EVENT_COLOR_CLASSES[colorId]) {
    return GOOGLE_EVENT_COLOR_CLASSES[colorId];
  }

  const summaryLower = (summary || '').toLowerCase();
  if (HOLIDAY_KEYWORDS.some((keyword) => summaryLower.includes(keyword))) {
    return GOOGLE_EVENT_COLOR_CLASSES['10'];
  }
  if (CELEBRATION_KEYWORDS.some((keyword) => summaryLower.includes(keyword))) {
    return GOOGLE_EVENT_COLOR_CLASSES['4'];
  }

  const fallbackId = CYCLE_COLOR_IDS[index % CYCLE_COLOR_IDS.length];
  return GOOGLE_EVENT_COLOR_CLASSES[fallbackId] || GOOGLE_EVENT_COLOR_CLASSES['9'];
}
