export const CACHE_KEYS = {
  driveRecent: 'drive:recent',
  driveFolder: (folderId: string) => `drive:folder:${folderId}`,
  driveSearch: (query: string) => `drive:search:${query.toLowerCase().trim()}`,
  githubRepos: (page: number, perPage: number) => `github:repos:p${page}:s${perPage}`,
  githubOverview: 'github:overview',
  githubInbox: (filter: string) => `github:inbox:${filter}`,
  githubRepo: (owner: string, repo: string) => `github:repo:${owner}/${repo}`,
} as const;
