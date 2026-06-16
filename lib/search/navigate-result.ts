import type { SuperSearchResult } from './types';

type NavigateContext = {
  focusPlugin: (pluginId: string) => void;
  setSelectedEmailId: (id: string | null) => void;
  setEmailCategory: (category: string) => void;
  setCurrentDateStr: (dateStr: string) => void;
  setCalendarView: (view: 'Month' | 'Week' | 'Day' | 'Year') => void;
  openGithubRepo: (repoFullName: string, tab?: 'pulls' | 'issues' | 'commits' | 'releases' | 'actions') => void;
  openGithubItem: (params: {
    repoFullName: string;
    kind: 'pull' | 'issue';
    number: number;
  }) => void;
  openDriveFolder: (folderId: string) => void;
  openDriveFile: (fileId: string) => void;
};

export function navigateSuperSearchResult(
  result: SuperSearchResult,
  ctx: NavigateContext
): void {
  switch (result.kind) {
    case 'email':
      ctx.focusPlugin('email');
      ctx.setEmailCategory('ALL');
      ctx.setSelectedEmailId(result.id);
      break;

    case 'calendar':
      ctx.focusPlugin('calendar');
      if (result.date) {
        ctx.setCurrentDateStr(new Date(result.date).toISOString());
        ctx.setCalendarView('Week');
      }
      break;

    case 'github_repo':
      ctx.focusPlugin('github');
      ctx.openGithubRepo(result.id);
      break;

    case 'github_pull': {
      const repoFullName = String(result.meta?.repoFullName ?? '');
      const number = Number(result.meta?.number ?? 0);
      if (repoFullName && number) {
        ctx.focusPlugin('github');
        ctx.openGithubItem({ repoFullName, kind: 'pull', number });
      } else if (result.href) {
        window.open(result.href, '_blank', 'noopener,noreferrer');
      }
      break;
    }

    case 'github_issue': {
      const repoFullName = String(result.meta?.repoFullName ?? '');
      const number = Number(result.meta?.number ?? 0);
      if (repoFullName && number) {
        ctx.focusPlugin('github');
        ctx.openGithubItem({ repoFullName, kind: 'issue', number });
      } else if (result.href) {
        window.open(result.href, '_blank', 'noopener,noreferrer');
      }
      break;
    }

    case 'drive_folder':
      ctx.focusPlugin('drive');
      ctx.openDriveFolder(result.id);
      break;

    case 'drive_file':
      ctx.focusPlugin('drive');
      if (result.href) {
        window.open(result.href, '_blank', 'noopener,noreferrer');
      } else {
        ctx.openDriveFile(result.id);
      }
      break;

    default:
      break;
  }
}
