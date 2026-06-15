/**
 * Indian public (gazetted) holidays for 2026.
 * Each holiday is assigned a Google Calendar colorId for visual distinction.
 *
 * Color reference (from calendar-grid.tsx googleColorMap):
 *  1 = Lavender   2 = Sage      3 = Grape     4 = Flamingo
 *  5 = Banana     6 = Tangerine 7 = Peacock   8 = Graphite
 *  9 = Blueberry 10 = Basil    11 = Tomato
 */
export type IndianHoliday = {
  date: string; // YYYY-MM-DD
  name: string;
  colorId: string;
};

export const INDIAN_PUBLIC_HOLIDAYS: IndianHoliday[] = [
  // ─── January ──────────────────────────────────────────────
  { date: '2026-01-01', name: "New Year's Day", colorId: '7' },
  { date: '2026-01-14', name: 'Makar Sankranti / Pongal', colorId: '6' },
  { date: '2026-01-26', name: 'Republic Day', colorId: '9' },

  // ─── February ─────────────────────────────────────────────
  { date: '2026-02-16', name: 'Vasant Panchami', colorId: '5' },

  // ─── March ────────────────────────────────────────────────
  { date: '2026-03-14', name: 'Holi', colorId: '3' },
  { date: '2026-03-20', name: 'Eid-ul-Fitr (Tentative)', colorId: '2' },
  { date: '2026-03-30', name: 'Ugadi / Gudi Padwa', colorId: '6' },

  // ─── April ────────────────────────────────────────────────
  { date: '2026-04-02', name: 'Ram Navami', colorId: '6' },
  { date: '2026-04-06', name: 'Mahavir Jayanti', colorId: '10' },
  { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', colorId: '9' },
  { date: '2026-04-18', name: 'Good Friday', colorId: '8' },

  // ─── May ──────────────────────────────────────────────────
  { date: '2026-05-01', name: 'May Day / Labour Day', colorId: '11' },
  { date: '2026-05-12', name: 'Buddha Purnima', colorId: '5' },
  { date: '2026-05-27', name: 'Eid-ul-Adha (Tentative)', colorId: '2' },

  // ─── June ─────────────────────────────────────────────────
  { date: '2026-06-26', name: 'Muharram (Tentative)', colorId: '8' },

  // ─── July ─────────────────────────────────────────────────
  { date: '2026-07-07', name: 'Rath Yatra', colorId: '6' },

  // ─── August ───────────────────────────────────────────────
  { date: '2026-08-05', name: 'Milad-un-Nabi (Tentative)', colorId: '2' },
  { date: '2026-08-15', name: 'Independence Day', colorId: '9' },
  { date: '2026-08-16', name: 'Janmashtami', colorId: '3' },

  // ─── September ────────────────────────────────────────────
  { date: '2026-09-05', name: 'Teachers\' Day', colorId: '7' },

  // ─── October ──────────────────────────────────────────────
  { date: '2026-10-02', name: 'Gandhi Jayanti', colorId: '10' },
  { date: '2026-10-07', name: 'Navratri Begins', colorId: '4' },
  { date: '2026-10-16', name: 'Dussehra (Vijaya Dashami)', colorId: '6' },

  // ─── November ─────────────────────────────────────────────
  { date: '2026-11-04', name: 'Diwali', colorId: '5' },
  { date: '2026-11-05', name: 'Govardhan Puja', colorId: '6' },
  { date: '2026-11-06', name: 'Bhai Dooj', colorId: '4' },
  { date: '2026-11-19', name: 'Guru Nanak Jayanti', colorId: '1' },

  // ─── December ─────────────────────────────────────────────
  { date: '2026-12-25', name: 'Christmas Day', colorId: '10' },
];
