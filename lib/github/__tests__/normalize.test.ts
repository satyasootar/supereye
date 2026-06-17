import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPullRequestIssue,
  normalizeIssue,
  normalizePullRequest,
  normalizeRepo,
} from '../normalize.ts';

describe('normalizeRepo', () => {
  it('maps snake_case GitHub API fields', () => {
    const repo = normalizeRepo({
      id: 99,
      name: 'supereye',
      full_name: 'kollects/supereye',
      owner: { login: 'kollects' },
      private: true,
      html_url: 'https://github.com/kollects/supereye',
      open_issues_count: 4,
      stargazers_count: 12,
      forks_count: 3,
      updated_at: '2026-01-15T10:00:00.000Z',
    });

    assert.equal(repo.fullName, 'kollects/supereye');
    assert.equal(repo.owner, 'kollects');
    assert.equal(repo.private, true);
    assert.equal(repo.htmlUrl, 'https://github.com/kollects/supereye');
    assert.equal(repo.openIssuesCount, 4);
    assert.equal(repo.stargazersCount, 12);
    assert.equal(repo.forksCount, 3);
    assert.equal(repo.updatedAt, '2026-01-15T10:00:00.000Z');
  });
});

describe('normalizePullRequest', () => {
  it('normalizes pull request payload', () => {
    const pr = normalizePullRequest(
      {
        id: 1,
        number: 7,
        title: 'Fix auth',
        state: 'open',
        user: { login: 'dev', avatar_url: 'https://avatar' },
        updated_at: '2026-02-01T00:00:00.000Z',
      },
      'acme',
      'app'
    );

    assert.equal(pr.number, 7);
    assert.equal(pr.repoFullName, 'acme/app');
    assert.equal(pr.authorLogin, 'dev');
    assert.equal(pr.state, 'open');
  });
});

describe('normalizeIssue', () => {
  it('normalizes issue payload', () => {
    const issue = normalizeIssue(
      {
        id: 2,
        number: 11,
        title: 'Bug report',
        state: 'open',
        user: { login: 'qa' },
        updated_at: '2026-02-02T00:00:00.000Z',
      },
      'acme',
      'app'
    );

    assert.equal(issue.number, 11);
    assert.equal(issue.repoFullName, 'acme/app');
    assert.equal(issue.title, 'Bug report');
  });
});

describe('isPullRequestIssue', () => {
  it('detects PR-shaped issues', () => {
    assert.equal(isPullRequestIssue({ pull_request: { url: 'x' } }), true);
    assert.equal(isPullRequestIssue({ title: 'plain issue' }), false);
  });
});
