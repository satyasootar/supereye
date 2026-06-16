import { getDriveApi } from '@/lib/drive/client';
import { fetchDriveRecent } from '@/lib/drive/fetch';
import type { BriefDriveData } from './types';

export async function fetchBriefDriveData(userId: string): Promise<BriefDriveData | null> {
  try {
    const api = getDriveApi(userId);
    const overview = await fetchDriveRecent(api);

    const seen = new Set<string>();
    const attentionItems = [...overview.starred, ...overview.recent]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        isFolder: item.isFolder,
        modifiedTime: item.modifiedTime,
        webViewLink: item.webViewLink,
        fileExtension: item.fileExtension,
        starred: overview.starred.some((s) => s.id === item.id),
      }))
      .sort(
        (a, b) =>
          new Date(b.modifiedTime ?? 0).getTime() - new Date(a.modifiedTime ?? 0).getTime()
      )
      .slice(0, 10);

    return {
      stats: {
        recentCount: overview.stats.recentCount,
        starredCount: overview.stats.starredCount,
      },
      attentionItems,
    };
  } catch (error) {
    console.error('[daily-brief] Drive data fetch failed:', error);
    return null;
  }
}
