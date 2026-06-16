import type { ActivePluginStatus, PluginId } from '@/lib/plugins/types';

export type EmailInsightCategory =
  | 'action_required'
  | 'meeting'
  | 'otp'
  | 'bank'
  | 'delivery'
  | 'invoice'
  | 'social'
  | 'newsletter'
  | 'fyi';

export const INSIGHT_CATEGORY_LABELS: Record<EmailInsightCategory, string> = {
  action_required: 'Needs action',
  meeting: 'Meeting',
  otp: 'Verification code',
  bank: 'Bank & finance',
  delivery: 'Delivery',
  invoice: 'Invoice',
  social: 'Social',
  newsletter: 'Newsletter',
  fyi: 'FYI',
};

export type ExtractedLink = {
  type: 'google_meet' | 'zoom' | 'teams' | 'webex' | 'generic';
  url: string;
  label?: string;
};

export type ExtractedOtp = {
  code: string;
  label?: string;
};

export type BriefActionKind =
  | 'join_meeting'
  | 'reply_email'
  | 'read_email'
  | 'copy_otp'
  | 'review_bank'
  | 'prepare_event';

export type BriefActionItem = {
  id: string;
  kind: BriefActionKind;
  title: string;
  description?: string;
  priority: number;
  sourcePlugin?: PluginId | null;
  href?: string;
  emailId?: string;
  eventId?: string;
  meetUrl?: string;
  otpCode?: string;
};

/** Infer plugin source for action items missing `sourcePlugin` (e.g. cached briefs). */
export function inferActionSourcePlugin(action: BriefActionItem): PluginId | null {
  if (action.sourcePlugin) return action.sourcePlugin;
  if (action.id.startsWith('github-')) return 'github';
  if (action.id.startsWith('drive-')) return 'drive';
  if (action.id.startsWith('join-') || action.id.startsWith('prep-')) return 'calendar';
  if (
    action.id.startsWith('urgent-') ||
    action.id.startsWith('otp-') ||
    action.id.startsWith('email-meet-')
  ) {
    return 'email';
  }
  if (action.eventId && !action.emailId) return 'calendar';
  if (action.emailId) return 'email';
  return null;
}

export type BriefEmailInsight = {
  id: string;
  subject: string | null;
  sender: string | null;
  snippet: string | null;
  category: EmailInsightCategory;
  insightSummary: string | null;
  priorityTier: 'urgent' | 'can_wait' | null;
  priorityReason: string | null;
  links: ExtractedLink[];
  otps: ExtractedOtp[];
  receivedAt: string | null;
};

export type BriefEventItem = {
  id: string;
  title: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  meetUrl: string | null;
  htmlLink: string | null;
  linkedEmailId: string | null;
  minutesUntilStart: number | null;
  isHappeningNow: boolean;
};

export type BriefGithubItem = {
  kind: 'pull' | 'issue';
  number: number;
  title: string;
  repoFullName: string;
  authorLogin: string | null;
  updatedAt: string | null;
  htmlUrl: string | null;
  labels: string[];
  draft?: boolean;
};

export type BriefGithubData = {
  stats: {
    repoCount: number;
    openPulls: number;
    openIssues: number;
  };
  attentionItems: BriefGithubItem[];
};

export type BriefDriveItem = {
  id: string;
  name: string;
  isFolder: boolean;
  modifiedTime: string | null;
  webViewLink: string | null;
  fileExtension: string | null;
  starred: boolean;
};

export type BriefDriveData = {
  stats: {
    recentCount: number;
    starredCount: number;
  };
  attentionItems: BriefDriveItem[];
};

export type BriefPayload = {
  generatedAt: string;
  briefDate: string;
  narrative: string | null;
  greeting: string;
  actionItems: BriefActionItem[];
  triage: { urgent: number; canWait: number; pending: number };
  emailsByCategory: Partial<Record<EmailInsightCategory, BriefEmailInsight[]>>;
  urgentEmails: BriefEmailInsight[];
  todayEvents: BriefEventItem[];
  upcomingEvents: BriefEventItem[];
  plugins: ActivePluginStatus[];
  connectedPluginIds: PluginId[];
  github: BriefGithubData | null;
  drive: BriefDriveData | null;
  stats: {
    unreadInbox: number;
    meetingsToday: number;
    otpsToday: number;
    bankAlerts: number;
    openPulls: number;
    openIssues: number;
    repoCount: number;
    recentFiles: number;
    starredFiles: number;
  };
};
