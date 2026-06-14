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
import { Mail, Calendar, Trash2, Loader2, Layers, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLUGIN_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  calendar: Calendar,
};

function WorkspacePluginEditor({
  workspaceId,
  workspaceName,
  index,
  isActive,
  primary,
  sidebar,
  connectedPlugins,
  canDelete,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  workspaceId: string;
  workspaceName: string;
  index: number;
  isActive: boolean;
  primary: PluginId;
  sidebar: PluginId | null;
  connectedPlugins: PluginId[];
  canDelete: boolean;
  onSave: (primary: PluginId, sidebar: PluginId | null) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [draftPrimary, setDraftPrimary] = useState(primary);
  const [draftSidebar, setDraftSidebar] = useState<string>(sidebar ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftPrimary(primary);
    setDraftSidebar(sidebar ?? '');
  }, [primary, sidebar]);

  const sidebarValue = draftSidebar || null;
  const isDirty =
    draftPrimary !== primary || sidebarValue !== sidebar;
  const canSave =
    isDirty &&
    draftPrimary &&
    connectedPlugins.includes(draftPrimary) &&
    (!sidebarValue || (sidebarValue !== draftPrimary && connectedPlugins.includes(sidebarValue as PluginId)));

  const handleSave = async () => {
    setError(null);
    try {
      await onSave(draftPrimary, sidebarValue);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  return (
    <li
      className={cn(
        'rounded-xl border p-4 transition-colors',
        isActive
          ? 'border-accent-blue/40 bg-accent-blue/5'
          : 'border-border-subtle bg-bg-surface'
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
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
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-secondary">Primary plugin</span>
          <select
            value={draftPrimary}
            onChange={(e) => setDraftPrimary(e.target.value)}
            className="rounded-md border border-border-default bg-bg-elevated px-3 py-2 text-[13px] text-text-primary"
          >
            {connectedPlugins.map((id) => (
              <option key={id} value={id}>
                {getPlugin(id)?.label ?? id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-secondary">
            Second plugin <span className="text-text-muted">(optional)</span>
          </span>
          <select
            value={draftSidebar}
            onChange={(e) => setDraftSidebar(e.target.value)}
            className="rounded-md border border-border-default bg-bg-elevated px-3 py-2 text-[13px] text-text-primary"
          >
            <option value="">None</option>
            {connectedPlugins
              .filter((id) => id !== draftPrimary)
              .map((id) => (
                <option key={id} value={id}>
                  {getPlugin(id)?.label ?? id}
                </option>
              ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-destructive">{error}</p>
      )}

      <Button
        size="sm"
        disabled={!canSave || isSaving}
        onClick={() => void handleSave()}
        className="mt-4 gap-2"
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        Save changes
      </Button>
    </li>
  );
}

export function WorkspaceLayoutSection() {
  const {
    workspaces,
    activeWorkspace,
    connectedPlugins,
    createWorkspace,
    deleteWorkspace,
    updateWorkspaceLayout,
    isCreating,
    isUpdating,
    isDeleting,
  } = useWorkspaces();
  const { activePlugins, primary, sidebar, setLayout, layoutModes } = useWorkspaceLayout();
  const layout = { primary, sidebar };

  const [newPrimary, setNewPrimary] = useState<PluginId>('email');
  const [newSidebar, setNewSidebar] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (connectedPlugins.length > 0 && !connectedPlugins.includes(newPrimary)) {
      setNewPrimary(connectedPlugins[0]);
    }
  }, [connectedPlugins, newPrimary]);

  const unassignedPlugins = connectedPlugins.filter(
    (id) => !workspaces.some((ws) => ws.pluginIds.includes(id))
  );

  const handleCreate = async () => {
    setCreateError(null);
    try {
      await createWorkspace({
        primaryPluginId: newPrimary,
        sidebarPluginId: newSidebar || null,
        name: generateWorkspaceName(
          newSidebar && newSidebar !== newPrimary
            ? [newPrimary, newSidebar]
            : [newPrimary]
        ),
      });
      setNewSidebar('');
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create workspace');
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
        description={`New plugins are assigned automatically (up to ${MAX_PLUGINS_PER_WORKSPACE} per workspace). You can rearrange them here anytime.`}
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
              connectedPlugins={connectedPlugins}
              canDelete={workspaces.length > 1}
              isSaving={savingId === ws.id && isUpdating}
              isDeleting={isDeleting}
              onSave={async (primary, sidebar) => {
                setSavingId(ws.id);
                try {
                  await updateWorkspaceLayout(ws.id, primary, sidebar);
                } finally {
                  setSavingId(null);
                }
              }}
              onDelete={async () => {
                await deleteWorkspace(ws.id);
              }}
            />
          ))}
        </ul>

        {unassignedPlugins.length > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-[12px] text-amber-700 dark:text-amber-300">
            <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Unassigned: {unassignedPlugins.map((id) => getPlugin(id)?.label ?? id).join(', ')}.
            Add them to a workspace below or save an existing workspace with room.
          </p>
        )}

        <p className="mt-4 flex items-start gap-2 text-[12px] text-text-muted">
          <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-blue" />
          Moving a plugin to another workspace removes it from the previous one automatically.
        </p>
      </ProfileSection>

      <ProfileSection
        title="Create workspace"
        description={`Group up to ${MAX_PLUGINS_PER_WORKSPACE} connected plugins into a new workspace.`}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-secondary">Primary plugin</span>
              <select
                value={newPrimary}
                onChange={(e) => setNewPrimary(e.target.value)}
                className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-[13px] text-text-primary"
              >
                {connectedPlugins.map((id) => (
                  <option key={id} value={id}>
                    {getPlugin(id)?.label ?? id}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-secondary">Second plugin (optional)</span>
              <select
                value={newSidebar}
                onChange={(e) => setNewSidebar(e.target.value)}
                className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-[13px] text-text-primary"
              >
                <option value="">None</option>
                {connectedPlugins
                  .filter((id) => id !== newPrimary)
                  .map((id) => (
                    <option key={id} value={id}>
                      {getPlugin(id)?.label ?? id}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {createError && (
            <p className="text-[12px] text-destructive">{createError}</p>
          )}
          <Button
            onClick={() => void handleCreate()}
            disabled={isCreating || connectedPlugins.length === 0}
            className="w-fit gap-2"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create workspace
          </Button>
        </div>
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
        description="Press ? for the full cheat sheet, or customize bindings in Profile → Shortcuts."
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
          <li>
            <kbd className="rounded bg-bg-highlight px-1.5 py-0.5 font-mono text-[11px]">?</kbd> Open
            shortcut reference
          </li>
        </ul>
      </ProfileSection>
    </div>
  );
}
