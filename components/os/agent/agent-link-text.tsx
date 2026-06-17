import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?'")\]}])/g;

function isUrl(part: string) {
  return /^https?:\/\//.test(part);
}

export const agentLinkClassName =
  'text-accent-blue underline underline-offset-2 hover:text-accent-blue-dim break-all';

export function AgentLinkText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(URL_RE);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        isUrl(part) ? (
          <a
            key={`${i}-${part.slice(0, 24)}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={agentLinkClassName}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function agentMarkdownLinkProps(className?: string) {
  return {
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(agentLinkClassName, className)}
      >
        {children}
      </a>
    ),
  };
}
