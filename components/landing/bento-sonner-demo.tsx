'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedList } from '@/components/ui/animated-list';

interface Item {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

let notifications = [
  {
    name: "Urgent email flagged",
    description: "GitHub security advisory needs attention",
    time: "10m ago",
    icon: "⚡",
    color: "rgba(239, 68, 68, 0.15)",
  },
  {
    name: "AI triage complete",
    description: "10 urgent · 82 can wait — inbox sorted",
    time: "15m ago",
    icon: "🤖",
    color: "rgba(139, 92, 246, 0.15)",
  },
  {
    name: "Meeting in 15 mins",
    description: "Code — Google Meet link is ready",
    time: "5m ago",
    icon: "📅",
    color: "rgba(74, 109, 85, 0.15)",
  },
  {
    name: "New email from Sahil",
    description: "I want to connect — Nab Bharat Enterprises",
    time: "2m ago",
    icon: "📩",
    color: "rgba(251, 146, 60, 0.15)",
  },
];

notifications = Array.from({ length: 10 }, () => notifications).flat();

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-xl p-3 mb-2",
        "transition-all duration-200 ease-in-out hover:scale-[102%]",
        // light styles
        "bg-white border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.02)]",
        // dark styles
        "dark:bg-bg-elevated/40 dark:backdrop-blur-md dark:border-white/5 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-base">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden min-w-0">
          <figcaption className="flex flex-row items-center text-[12px] font-semibold text-text-primary">
            <span className="truncate">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-[10px] text-text-muted font-normal">{time}</span>
          </figcaption>
          <p className="text-[11px] font-normal text-text-secondary truncate mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function BentoSonnerDemo({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-[280px] w-full flex-col overflow-hidden p-2",
        className
      )}
    >
      <AnimatedList delay={1500}>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>

      {/* Fade out bottom overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-app to-transparent z-20"></div>
    </div>
  );
}
