'use client';

import { useEffect } from 'react';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { ChevronDown, LayoutGrid, Plus } from 'lucide-react';
import { getPlugin } from '@/lib/plugins/registry';
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
            <p className="truncate text-[12px] font-semibold text-text-primary">{label}</p>
            <p className="truncate text-[10px] text-text-muted">
              {activeWorkspace?.pluginIds
                .map((id) => getPlugin(id)?.shortLabel ?? id)
                .join(' · ')}
            </p>
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
              <p className="truncate text-[12px] font-medium">{ws.name}</p>
              <p className="truncate text-[10px] text-text-muted">
                {ws.pluginIds.map((id) => getPlugin(id)?.shortLabel ?? id).join(' + ')}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
