'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceLayout } from '@/hooks/use-workspace-layout';
import {
  getPlugin,
  generateWorkspaceName,
  MAX_PLUGINS_PER_WORKSPACE,
} from '@/lib/plugins/registry';
import { ProfileSection } from '@/components/profile/profile-section';
import { isLayoutModeActive } from '@/lib/plugins/layout';
import type { PluginId } from '@/lib/plugins/types';
import { Mail, Calendar, Trash2, Loader2, Layers, Plus, GitPullRequest, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLUGIN_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  calendar: Calendar,
  github: GitPullRequest,
  drive: HardDrive,
};

type DragPayload = {
  pluginId: PluginId;
  sourceWorkspaceId: string | null;
  sourceSlot: 'primary' | 'sidebar' | null;
};

function DraggablePluginChip({
  pluginId,
  sourceWorkspaceId,
  sourceSlot,
}: {
  pluginId: PluginId;
  sourceWorkspaceId: string | null;
  sourceSlot: 'primary' | 'sidebar' | null;
}) {
  const Icon = PLUGIN_ICONS[pluginId] ?? Mail;
  const plugin = getPlugin(pluginId);
  return (
    <div
      draggable
      onDragStart={(e) => {
        const payload: DragPayload = { pluginId, sourceWorkspaceId, sourceSlot };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border-default bg-bg-surface px-3 py-2 cursor-grab active:cursor-grabbing hover:border-accent-blue/50 transition-colors shadow-sm w-full"
      )}
    >
      <Icon className="h-4 w-4 text-text-secondary" />
      <span className="text-[13px] font-medium text-text-primary truncate">{plugin?.label ?? pluginId}</span>
    </div>
  );
}

function PluginSlot({
  label,
  pluginId,
  workspaceId,
  slotType,
  onDropPlugin,
}: {
  label: string;
  pluginId: PluginId | null;
  workspaceId: string;
  slotType: 'primary' | 'sidebar';
  onDropPlugin: (payload: DragPayload, targetWorkspaceId: string, targetSlot: 'primary' | 'sidebar') => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <label className="flex flex-col gap-1.5 flex-1 min-w-0 relative">
      <span className="text-[12px] font-medium text-text-secondary">
        {label}
        {slotType === 'sidebar' && <span className="text-text-muted ml-1">(optional)</span>}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          try {
            const payload = JSON.parse(e.dataTransfer.getData('application/json')) as DragPayload;
            onDropPlugin(payload, workspaceId, slotType);
          } catch (err) {}
        }}
        className={cn(
          "flex min-h-[44px] flex-col justify-center rounded-md border-2 border-dashed p-1 transition-colors relative z-10",
          isOver ? "border-accent-blue bg-accent-blue/5" : "border-transparent bg-bg-elevated",
          !pluginId && "items-center border-border-default bg-bg-surface hover:border-border-strong"
        )}
      >
        {pluginId ? (
          <DraggablePluginChip pluginId={pluginId} sourceWorkspaceId={workspaceId} sourceSlot={slotType} />
        ) : (
          <span className="text-[12px] text-text-muted opacity-50">Drag plugin here</span>
        )}
      </div>
    </label>
  );
}

function WorkspacePluginEditor({
  workspaceId,
  workspaceName,
  index,
  isActive,
  primary,
  sidebar,
  canDelete,
  onDelete,
  isSaving,
  isDeleting,
  onDropPlugin,
}: {
  workspaceId: string;
  workspaceName: string;
  index: number;
  isActive: boolean;
  primary: PluginId;
  sidebar: PluginId | null;
  canDelete: boolean;
  onDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  onDropPlugin: (payload: DragPayload, targetWorkspaceId: string, targetSlot: 'primary' | 'sidebar') => void;
}) {
  return (
    <li
      className={cn(
        'rounded-xl border p-4 transition-colors relative',
        isActive
          ? 'border-accent-blue/40 bg-accent-blue/5'
          : 'border-border-subtle bg-bg-surface'
      )}
    >
      {isSaving && (
         <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-bg-surface/50 backdrop-blur-[1px]">
           <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
         </div>
      )}
      <div className="mb-4 flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-[13px] font-semibold text-text-primary">
            <span className="mr-2 font-mono text-[11px] text-text-muted">⌘{index + 1}</span>
            {workspaceName}
          </p>
          {isActive && (
            <p className="mt-0.5 text-[11px] text-accent-blue">Active workspace</p>
          )}
        </div>
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isDeleting || isSaving}
            onClick={() => void onDelete()}
            className="text-destructive hover:text-destructive relative z-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 relative z-10">
         <PluginSlot label="Primary plugin" pluginId={primary} workspaceId={workspaceId} slotType="primary" onDropPlugin={onDropPlugin} />
         <PluginSlot label="Second plugin" pluginId={sidebar} workspaceId={workspaceId} slotType="sidebar" onDropPlugin={onDropPlugin} />
      </div>
    </li>
  );
}

function UnassignedZone({ plugins, onDropPlugin }: { plugins: PluginId[], onDropPlugin: (payload: DragPayload, tId: null, tSlot: null) => void }) {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setIsOver(false);
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json')) as DragPayload;
          onDropPlugin(payload, null, null);
        } catch (err) {}
      }}
      className={cn(
        "mt-4 rounded-xl border-2 border-dashed p-4 transition-colors min-h-[80px]",
        isOver ? "border-accent-blue bg-accent-blue/5" : "border-border-default bg-bg-surface hover:border-border-strong"
      )}
    >
       <h3 className="mb-3 text-[13px] font-medium text-text-secondary flex items-center gap-2">
         <Layers className="h-4 w-4 text-text-muted" />
         Unassigned Plugins
       </h3>
       <div className="flex flex-wrap gap-2">
         {plugins.map(id => <div key={id} className="w-48"><DraggablePluginChip pluginId={id} sourceWorkspaceId={null} sourceSlot={null} /></div>)}
         {plugins.length === 0 && <span className="text-[12px] text-text-muted mt-2">Drag plugins here to remove them from a workspace.</span>}
       </div>
    </div>
  )
}

function CreateWorkspaceZone({ onDropPlugin }: { onDropPlugin: (payload: DragPayload, tId: 'new', tSlot: 'primary') => void }) {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setIsOver(false);
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json')) as DragPayload;
          onDropPlugin(payload, 'new', 'primary');
        } catch (err) {}
      }}
      className={cn(
        "mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
        isOver ? "border-accent-blue bg-accent-blue/5" : "border-border-default bg-bg-surface hover:border-border-strong"
      )}
    >
      <Plus className="mb-2 h-6 w-6 text-text-muted" />
      <span className="text-[13px] font-medium text-text-secondary">Drag a plugin here to create a new workspace</span>
    </div>
  )
}

export function WorkspaceLayoutSection() {
  const {
    workspaces,
    activeWorkspace,
    connectedPlugins,
    createWorkspace,
    deleteWorkspace,
    updateWorkspaceLayout,
    isDeleting,
  } = useWorkspaces();
  
  const { activePlugins, primary, sidebar, setLayout, layoutModes } = useWorkspaceLayout();
  const layout = { primary, sidebar };

  const [savingId, setSavingId] = useState<string | null>(null);

  const unassignedPlugins = connectedPlugins.filter(
    (id) => !workspaces.some((ws) => ws.pluginIds.includes(id))
  );

  const handleDropPlugin = async (
    payload: DragPayload,
    targetWorkspaceId: string | null | 'new',
    targetSlot: 'primary' | 'sidebar' | null
  ) => {
    const { pluginId: draggedPluginId, sourceWorkspaceId, sourceSlot } = payload;
    
    // Do nothing if dropped in same slot
    if (sourceWorkspaceId === targetWorkspaceId && sourceSlot === targetSlot) return;

    let targetPluginId: PluginId | null = null;
    let targetWs = workspaces.find(w => w.id === targetWorkspaceId);

    if (targetWs && targetSlot) {
      targetPluginId = targetSlot === 'primary' ? targetWs.primaryPluginId : targetWs.sidebarPluginId;
    }

    try {
      if (targetWorkspaceId === 'new') {
        setSavingId('new');
        await createWorkspace({
          primaryPluginId: draggedPluginId,
          name: generateWorkspaceName([draggedPluginId])
        });
        
        if (sourceWorkspaceId) {
          const sw = workspaces.find(w => w.id === sourceWorkspaceId);
          if (sw) {
            let p = sw.primaryPluginId;
            let s = sw.sidebarPluginId;
            if (sourceSlot === 'primary') { p = s as PluginId; s = null; }
            if (sourceSlot === 'sidebar') { s = null; }
            if (!p) {
              await deleteWorkspace(sw.id);
            } else {
              await updateWorkspaceLayout(sw.id, p, s);
            }
          }
        }
      } else if (targetWorkspaceId === null) {
        if (sourceWorkspaceId) {
          setSavingId(sourceWorkspaceId);
          const sw = workspaces.find(w => w.id === sourceWorkspaceId);
          if (sw) {
            let p = sw.primaryPluginId;
            let s = sw.sidebarPluginId;
            if (sourceSlot === 'primary') { p = s as PluginId; s = null; }
            if (sourceSlot === 'sidebar') { s = null; }
            if (!p) {
              await deleteWorkspace(sw.id);
            } else {
              await updateWorkspaceLayout(sw.id, p, s);
            }
          }
        }
      } else {
        setSavingId(targetWorkspaceId);

        if (sourceWorkspaceId && sourceWorkspaceId !== targetWorkspaceId && targetPluginId) {
           const sw = workspaces.find(w => w.id === sourceWorkspaceId);
           if (sw) {
             let swPrimary = sw.primaryPluginId;
             let swSidebar = sw.sidebarPluginId;
             if (sourceSlot === 'primary') swPrimary = targetPluginId;
             if (sourceSlot === 'sidebar') swSidebar = targetPluginId;
             await updateWorkspaceLayout(sw.id, swPrimary, swSidebar);
           }
        } else if (sourceWorkspaceId && sourceWorkspaceId !== targetWorkspaceId && !targetPluginId) {
           const sw = workspaces.find(w => w.id === sourceWorkspaceId);
           if (sw) {
             let p = sw.primaryPluginId;
             let s = sw.sidebarPluginId;
             if (sourceSlot === 'primary') { p = s as PluginId; s = null; }
             if (sourceSlot === 'sidebar') { s = null; }
             if (!p) {
               await deleteWorkspace(sw.id);
             } else {
               await updateWorkspaceLayout(sw.id, p, s);
             }
           }
        }

        if (targetWs) {
           let twPrimary = targetWs.primaryPluginId;
           let twSidebar = targetWs.sidebarPluginId;
           if (targetSlot === 'primary') twPrimary = draggedPluginId;
           if (targetSlot === 'sidebar') twSidebar = draggedPluginId;
           
           if (sourceWorkspaceId === targetWorkspaceId && targetPluginId) {
             if (sourceSlot === 'primary') twPrimary = targetPluginId;
             if (sourceSlot === 'sidebar') twSidebar = targetPluginId;
           }

           if (twPrimary) {
              await updateWorkspaceLayout(targetWs.id, twPrimary, twSidebar);
           } else {
              twPrimary = twSidebar as PluginId;
              twSidebar = null;
              if (twPrimary) {
                 await updateWorkspaceLayout(targetWs.id, twPrimary, twSidebar);
              }
           }
        }
      }
    } finally {
      setSavingId(null);
    }
  };

  if (connectedPlugins.length === 0 && workspaces.length === 0) {
    return (
      <ProfileSection
        title="Workspaces"
        description="Connect integrations first — plugins are assigned to workspaces automatically."
      >
        <p className="text-[13px] text-text-muted">
          No connected plugins yet. Use the Connections tab to link Gmail or Google Calendar.
        </p>
      </ProfileSection>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileSection
        title="Your workspaces"
        description={`Drag and drop plugins to rearrange them. A workspace holds up to ${MAX_PLUGINS_PER_WORKSPACE} plugins.`}
      >
        <ul className="flex flex-col gap-3">
          {workspaces.map((ws, index) => (
            <WorkspacePluginEditor
              key={ws.id}
              workspaceId={ws.id}
              workspaceName={ws.name}
              index={index}
              isActive={activeWorkspace?.id === ws.id}
              primary={ws.primaryPluginId}
              sidebar={ws.sidebarPluginId}
              canDelete={workspaces.length > 1}
              isSaving={savingId === ws.id || savingId === 'new'}
              isDeleting={isDeleting}
              onDropPlugin={handleDropPlugin as any}
              onDelete={async () => {
                await deleteWorkspace(ws.id);
              }}
            />
          ))}
        </ul>

        <UnassignedZone plugins={unassignedPlugins} onDropPlugin={handleDropPlugin as any} />
        <CreateWorkspaceZone onDropPlugin={handleDropPlugin as any} />

      </ProfileSection>

      {activeWorkspace && activePlugins.length > 1 && (
        <ProfileSection
          title="Layout for active workspace"
          description="Swap which plugin is primary vs sidebar. Updates apply immediately."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {layoutModes.map((mode) => {
              const PrimaryIcon = PLUGIN_ICONS[mode.primary] ?? Mail;
              const SidebarIcon = mode.sidebar ? PLUGIN_ICONS[mode.sidebar] ?? Calendar : null;
              const active = isLayoutModeActive(layout, mode);

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setLayout(mode.primary, mode.sidebar)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    active
                      ? 'border-accent-blue bg-accent-blue/8 ring-1 ring-accent-blue/20'
                      : 'border-border-default bg-bg-surface hover:border-border-strong'
                  )}
                >
                  <p className="text-[13px] font-semibold text-text-primary">{mode.label}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-8 flex-1 items-center gap-1.5 rounded-md border border-border-subtle bg-bg-elevated px-2">
                      <PrimaryIcon className="h-3.5 w-3.5 text-accent-blue" />
                      <span className="text-[11px] font-medium">
                        {getPlugin(mode.primary)?.shortLabel}
                      </span>
                    </div>
                    {SidebarIcon && mode.sidebar && (
                      <>
                        <span className="text-[10px] text-text-muted">+</span>
                        <div className="flex h-8 w-24 items-center gap-1.5 rounded-md border border-border-subtle bg-bg-app px-2">
                          <SidebarIcon className="h-3.5 w-3.5 text-text-muted" />
                          <span className="text-[11px] text-text-muted">
                            {getPlugin(mode.sidebar)?.shortLabel}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[12px] text-text-muted">
            Shortcuts: <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">Ctrl+Shift+1</kbd> /{' '}
            <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">Ctrl+Shift+2</kbd> focus plugins in
            this workspace.
          </p>
        </ProfileSection>
      )}

      <ProfileSection
        title="Keyboard shortcuts"
        description="Customize bindings in Profile → Shortcuts."
      >
        <ul className="space-y-2 text-[13px] text-text-secondary">
          <li>
            <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">1</kbd> –{' '}
            <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">5</kbd> Switch
            workspace
          </li>
          <li>
            <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">Tab</kbd> Switch
            plugin in workspace
          </li>
          <li>
            <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">[</kbd>{' '}
            <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">]</kbd>{' '}
            Previous / next workspace
          </li>
        </ul>
      </ProfileSection>
    </div>
  );
}
