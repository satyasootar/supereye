import { getGithubAccessToken } from '@/lib/github/client';
import type { GithubContributionsCalendar, GithubContributionWeek } from '@/lib/github/types';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const CONTRIBUTIONS_QUERY = `
  query {
    viewer {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

type GraphQLResponse = {
  data?: {
    viewer?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: number;
          weeks?: Array<{
            contributionDays?: Array<{
              contributionCount?: number;
              date?: string;
            }>;
          }>;
        };
      };
    };
  };
  errors?: Array<{ message?: string }>;
};

export async function fetchGithubContributions(
  userId: string
): Promise<GithubContributionsCalendar | null> {
  try {
    const token = await getGithubAccessToken(userId);
    const res = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: CONTRIBUTIONS_QUERY }),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as GraphQLResponse;
    if (json.errors?.length) return null;

    const calendar = json.data?.viewer?.contributionsCollection?.contributionCalendar;
    if (!calendar) return null;

    const weeks: GithubContributionWeek[] = (calendar.weeks ?? []).map((week) => ({
      days: (week.contributionDays ?? []).map((day) => ({
        date: String(day.date ?? ''),
        count: Number(day.contributionCount ?? 0),
      })),
    }));

    return {
      totalContributions: Number(calendar.totalContributions ?? 0),
      weeks,
    };
  } catch {
    return null;
  }
}
