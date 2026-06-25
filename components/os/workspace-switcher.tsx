'use client';

import { useEffect } from 'react';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { ChevronDown, LayoutGrid, Plus } from 'lucide-react';
import { getPlugin, generateWorkspaceName } from '@/lib/plugins/registry';
import type { PluginId } from '@/lib/plugins/types';
import { TOUR_TARGETS } from '@/lib/tour/targets';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const {
    workspaces,
    activeWorkspace,
    activePlugins,
    switchWorkspace,
    isLoading,
  } = useWorkspaces();

  useEffect(() => {
    if (!activeWorkspace || isLoading) return;
    const workspacePlugins = activeWorkspace.pluginIds.filter((id) =>
      activePlugins.includes(id)
    );
    useAppStore.getState().applyWorkspaceLayout(
      {
        primary: activeWorkspace.primaryPluginId,
        sidebar: activeWorkspace.sidebarPluginId,
      },
      workspacePlugins.length > 0 ? workspacePlugins : activePlugins
    );
    useAppStore.getState().setActiveWorkspaceId(activeWorkspace.id);
  }, [activeWorkspace?.id, activePlugins, isLoading]);

  if (isLoading || workspaces.length === 0) return null;

  const label = activeWorkspace?.name ?? 'Workspace';
  const hasCustomName =
    !!activeWorkspace &&
    label !== generateWorkspaceName(activeWorkspace.pluginIds);

  if (collapsed) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={label}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="z-[220] w-[220px] p-1 border-border-default bg-bg-elevated"
        >
          <WorkspaceList
            workspaces={workspaces}
            activeId={activeWorkspace?.id}
            onSelect={switchWorkspace}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-tour={TOUR_TARGETS.workspaceSwitcher}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-border-subtle bg-bg-highlight/60 px-2.5 py-2 text-left transition-colors hover:bg-bg-highlight"
        >
          <div className="min-w-0">
            {hasCustomName && (
              <p className="truncate text-[12px] font-semibold text-text-primary">{label}</p>
            )}
            {activeWorkspace && (
              <WorkspaceLayoutLabel
                primaryPluginId={activeWorkspace.primaryPluginId}
                sidebarPluginId={activeWorkspace.sidebarPluginId}
                className={hasCustomName ? 'mt-0.5' : undefined}
              />
            )}
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[220] w-[260px] p-1 border-border-default bg-bg-elevated"
      >
        <WorkspaceList
          workspaces={workspaces}
          activeId={activeWorkspace?.id}
          onSelect={switchWorkspace}
        />
        <div className="mt-1 border-t border-border-subtle pt-1">
          <a
            href="/workspace/profile?tab=workspace"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Manage workspaces
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function WorkspaceList({
  workspaces,
  activeId,
  onSelect,
}: {
  workspaces: Array<{
    id: string;
    name: string;
    pluginIds: string[];
    primaryPluginId: PluginId;
    sidebarPluginId: PluginId | null;
    sortOrder: number;
  }>;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {workspaces.map((ws, index) => (
        <li key={ws.id}>
          <button
            type="button"
            onClick={() => onSelect(ws.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
              activeId === ws.id
                ? 'bg-bg-highlight text-text-primary'
                : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-bg-overlay font-mono text-[10px] text-text-muted">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              {ws.name !== generateWorkspaceName(ws.pluginIds) ? (
                <>
                  <p className="truncate text-[12px] font-medium">{ws.name}</p>
                  <WorkspaceLayoutLabel
                    primaryPluginId={ws.primaryPluginId}
                    sidebarPluginId={ws.sidebarPluginId}
                    className="mt-0.5"
                    subdued
                  />
                </>
              ) : (
                <WorkspaceLayoutLabel
                  primaryPluginId={ws.primaryPluginId}
                  sidebarPluginId={ws.sidebarPluginId}
                />
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function WorkspaceLayoutLabel({
  primaryPluginId,
  sidebarPluginId,
  className,
  subdued = false,
}: {
  primaryPluginId: PluginId;
  sidebarPluginId: PluginId | null;
  className?: string;
  subdued?: boolean;
}) {
  const primaryLabel = getPlugin(primaryPluginId)?.shortLabel ?? primaryPluginId;
  const sidebarLabel = sidebarPluginId
    ? getPlugin(sidebarPluginId)?.shortLabel ?? sidebarPluginId
    : null;

  if (!sidebarLabel) {
    return (
      <p
        className={cn(
          'truncate text-text-primary',
          subdued ? 'text-[10px] text-text-muted' : 'text-[12px] font-semibold',
          className
        )}
      >
        {primaryLabel}
      </p>
    );
  }

  return (
    <p
      className={cn(
        'flex min-w-0 items-center gap-1 truncate',
        subdued ? 'text-[10px]' : 'text-[12px]',
        className
      )}
      title={`${primaryLabel} is the main view · ${sidebarLabel} is the sidebar`}
    >
      <span className="inline-flex min-w-0 items-center gap-1">
        <span className="h-1 w-1 shrink-0 rounded-full bg-accent-blue" aria-hidden />
        <span
          className={cn(
            'truncate text-text-primary',
            subdued ? 'font-medium text-text-secondary' : 'font-semibold'
          )}
        >
          {primaryLabel}
        </span>
      </span>
      <span className="shrink-0 text-text-muted/50">+</span>
      <span className="truncate font-normal text-text-muted">{sidebarLabel}</span>
    </p>
  );
}
