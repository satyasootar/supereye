'use client';

import {
  Building2,
  ExternalLink,
  Globe,
  Link2,
  MapPin,
  Star,
  Users,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { GithubProfileBundle } from '@/lib/github/types';
import { GithubContributionGraph } from './github-contribution-graph';

function profileLinkLabel(url: string) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function MetaItem({
  icon: Icon,
  children,
  href,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
  href?: string;
}) {
  const content = (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary">
      <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      <span className="truncate">{children}</span>
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-accent-blue"
      >
        {content}
      </a>
    );
  }

  return content;
}

export function GithubProfileSection({
  bundle,
  className,
}: {
  bundle: GithubProfileBundle;
  className?: string;
}) {
  const { profile, contributions, starredRepos } = bundle;
  const displayName = profile.name ?? profile.login;
  const memberSince = profile.createdAt
    ? format(parseISO(profile.createdAt), 'MMMM yyyy')
    : null;

  return (
    <section
      className={cn(
        'border-b border-border-subtle bg-gradient-to-br from-bg-surface via-bg-elevated/40 to-bg-surface',
        className
      )}
    >
      <div className="px-5 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full border-2 border-border-default bg-bg-overlay object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-border-default bg-bg-overlay text-[24px] font-semibold text-text-muted">
                {profile.login.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-[22px] font-semibold leading-tight text-text-primary">
                  {displayName}
                </h2>
                {profile.name && (
                  <span className="text-[14px] font-medium text-text-muted">@{profile.login}</span>
                )}
                {profile.planName && (
                  <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-blue">
                    {profile.planName}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-secondary">
                  {profile.bio}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {profile.company && (
                  <MetaItem icon={Building2}>{profile.company.replace(/^@/, '')}</MetaItem>
                )}
                {profile.location && <MetaItem icon={MapPin}>{profile.location}</MetaItem>}
                {profile.blog && (
                  <MetaItem
                    icon={Globe}
                    href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                  >
                    {profileLinkLabel(profile.blog)}
                  </MetaItem>
                )}
                {profile.twitterUsername && (
                  <MetaItem
                    icon={Link2}
                    href={`https://twitter.com/${profile.twitterUsername}`}
                  >
                    @{profile.twitterUsername}
                  </MetaItem>
                )}
                {profile.email && (
                  <MetaItem icon={Link2} href={`mailto:${profile.email}`}>
                    {profile.email}
                  </MetaItem>
                )}
                {memberSince && (
                  <span className="text-[12px] text-text-muted">Joined {memberSince}</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px]">
                <span className="text-text-secondary">
                  <strong className="font-semibold text-text-primary">
                    {profile.followers.toLocaleString()}
                  </strong>{' '}
                  followers
                </span>
                <span className="text-text-secondary">
                  <strong className="font-semibold text-text-primary">
                    {profile.following.toLocaleString()}
                  </strong>{' '}
                  following
                </span>
                <span className="text-text-secondary">
                  <strong className="font-semibold text-text-primary">
                    {profile.publicRepos.toLocaleString()}
                  </strong>{' '}
                  public repos
                </span>
                {profile.publicGists > 0 && (
                  <span className="text-text-secondary">
                    <strong className="font-semibold text-text-primary">
                      {profile.publicGists.toLocaleString()}
                    </strong>{' '}
                    gists
                  </span>
                )}
                {profile.hireable && (
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                    Available for hire
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.htmlUrl && (
            <a
              href={profile.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-md border border-border-default bg-bg-surface px-3 text-[12px] font-medium text-text-primary transition-colors hover:border-border-strong hover:bg-bg-highlight"
            >
              View on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {contributions && (
          <div className="mt-6 rounded-xl border border-border-subtle bg-bg-surface/80 p-4 shadow-sm">
            <GithubContributionGraph calendar={contributions} />
          </div>
        )}

        {starredRepos.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <h3 className="text-[13px] font-semibold text-text-primary">Recently starred</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {starredRepos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.htmlUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-border-subtle bg-bg-surface px-3 py-2.5 transition-colors hover:border-border-default hover:bg-bg-highlight"
                >
                  <p className="truncate text-[13px] font-medium text-text-primary group-hover:text-accent-blue">
                    {repo.fullName}
                  </p>
                  {repo.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-text-muted">
                      {repo.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-text-muted">
                    {repo.language && <span>{repo.language}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {repo.stargazersCount}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {(profile.totalPrivateRepos != null || profile.ownedPrivateRepos != null) && (
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-overlay/60 px-2.5 py-1">
              <Users className="h-3 w-3" />
              {profile.ownedPrivateRepos ?? profile.totalPrivateRepos} private repos
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
