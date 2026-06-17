import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGithubReposPage,
  countGithubRepositories,
  parseRepositoriesListResult,
  resolveRepositoriesHasMore,
} from '../repos-page.ts';

describe('parseRepositoriesListResult', () => {
  it('returns array results as-is', () => {
    const rows = [{ id: 1, name: 'a' }];
    assert.deepEqual(parseRepositoriesListResult(rows), rows);
  });

  it('unwraps nested data keys', () => {
    const rows = [{ id: 2, name: 'b' }];
    assert.deepEqual(parseRepositoriesListResult({ repositories: rows }), rows);
    assert.deepEqual(parseRepositoriesListResult({ items: rows }), rows);
  });

  it('returns empty array for invalid input', () => {
    assert.deepEqual(parseRepositoriesListResult(null), []);
    assert.deepEqual(parseRepositoriesListResult({}), []);
  });
});

describe('resolveRepositoriesHasMore', () => {
  it('reads explicit hasMore flag', () => {
    assert.equal(resolveRepositoriesHasMore({ hasMore: true }, 1, 20), true);
    assert.equal(resolveRepositoriesHasMore({ hasMore: false }, 20, 20), false);
  });

  it('reads pagination.hasNext', () => {
    assert.equal(
      resolveRepositoriesHasMore({ pagination: { hasNext: true } }, 10, 20),
      true
    );
  });

  it('infers more pages when page is full', () => {
    assert.equal(resolveRepositoriesHasMore([], 20, 20), true);
    assert.equal(resolveRepositoriesHasMore([], 19, 20), false);
  });
});

describe('buildGithubReposPage', () => {
  it('normalizes repos and pagination metadata', () => {
    const page = buildGithubReposPage(
      [
        {
          id: 42,
          name: 'supereye',
          full_name: 'acme/supereye',
          owner: { login: 'acme' },
          private: false,
        },
      ],
      2,
      20
    );

    assert.equal(page.page, 2);
    assert.equal(page.perPage, 20);
    assert.equal(page.repos.length, 1);
    assert.equal(page.repos[0]?.fullName, 'acme/supereye');
    assert.equal(page.hasMore, false);
  });
});

describe('countGithubRepositories', () => {
  it('paginates until a short page is returned', async () => {
    const calls: Record<string, unknown>[] = [];

    const total = await countGithubRepositories(async (input) => {
      calls.push(input);
      const page = Number(input.page ?? 1);
      if (page === 1) {
        return Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `repo-${i}` }));
      }
      return Array.from({ length: 60 }, (_, i) => ({ id: i + 101, name: `repo-${i + 100}` }));
    }, 100);

    assert.equal(total, 160);
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.page, 1);
    assert.equal(calls[1]?.page, 2);
  });

  it('respects pagination.hasNext from API', async () => {
    let page = 0;
    const total = await countGithubRepositories(async () => {
      page += 1;
      return {
        data: [{ id: page, name: `repo-${page}` }],
        pagination: { hasNext: page < 3 },
      };
    }, 1);

    assert.equal(total, 3);
    assert.equal(page, 3);
  });
});
