import type { PluginId } from '@/lib/plugins/types';

export type SuperSearchKind =
  | 'email'
  | 'calendar'
  | 'github_repo'
  | 'github_pull'
  | 'github_issue'
  | 'drive_file'
  | 'drive_folder';

export type SuperSearchResult = {
  id: string;
  kind: SuperSearchKind;
  pluginId: PluginId;
  title: string;
  subtitle?: string;
  date?: string | null;
  href?: string | null;
  meta?: Record<string, string | number | undefined>;
};

export type SuperSearchResponse = {
  results: SuperSearchResult[];
  meta: {
    query: string;
    tookMs: number;
    mode: 'fts' | 'keyword';
  };
};
