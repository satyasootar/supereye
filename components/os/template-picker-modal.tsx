'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, FileText, ArrowDownToLine, Save, Eye, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeEmailHtml } from '@/lib/mail/sanitize-html';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  isPredefined: boolean;
};

type TemplateDraft = {
  name: string;
  subject: string;
  htmlContent: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInject: (payload: { subject: string; htmlContent: string }) => void;
  initialTemplateId?: string | null;
};

function templateToDraft(tpl: MailTemplate): TemplateDraft {
  return {
    name: tpl.name,
    subject: tpl.subject,
    htmlContent: tpl.htmlContent,
  };
}

export function TemplatePickerModal({
  open,
  onOpenChange,
  onInject,
  initialTemplateId,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>({ name: '', subject: '', htmlContent: '' });
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  const templatesQuery = useQuery<{ templates: MailTemplate[] }>({
    queryKey: ['mail-templates'],
    queryFn: async () => {
      const res = await fetch('/api/mail/templates');
      if (!res.ok) throw new Error('Failed to load templates');
      return res.json();
    },
    enabled: open,
  });

  const templates = templatesQuery.data?.templates ?? [];
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setDraft({ name: '', subject: '', htmlContent: '' });
      setEditorTab('edit');
    }
  }, [open]);

  useEffect(() => {
    if (!open || templates.length === 0 || selectedId) return;

    const preferredId =
      initialTemplateId && templates.some((t) => t.id === initialTemplateId)
        ? initialTemplateId
        : templates[0].id;

    const tpl = templates.find((t) => t.id === preferredId);
    if (!tpl) return;

    setSelectedId(preferredId);
    setDraft(templateToDraft(tpl));
  }, [open, templates, selectedId, initialTemplateId]);

  const selectTemplate = (tpl: MailTemplate) => {
    setSelectedId(tpl.id);
    setDraft(templateToDraft(tpl));
    setEditorTab('edit');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || selectedTemplate.isPredefined) {
        throw new Error('Cannot update built-in templates');
      }
      const res = await fetch(`/api/mail/templates/${selectedTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          subject: draft.subject,
          htmlContent: draft.htmlContent,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to save template');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Template saved');
      void queryClient.invalidateQueries({ queryKey: ['mail-templates'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveAsNewMutation = useMutation({
    mutationFn: async () => {
      if (!draft.htmlContent.trim()) throw new Error('HTML content is required');
      const name =
        draft.name.trim() ||
        window.prompt('Template name', `${selectedTemplate?.name ?? 'Custom'} copy`)?.trim();
      if (!name) throw new Error('Template name is required');

      const res = await fetch('/api/mail/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject: draft.subject,
          htmlContent: draft.htmlContent,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to save template');
      }
      return res.json() as Promise<{ template: MailTemplate }>;
    },
    onSuccess: (data) => {
      toast.success('Template saved');
      void queryClient.invalidateQueries({ queryKey: ['mail-templates'] });
      if (data.template?.id) {
        setSelectedId(data.template.id);
        setDraft(templateToDraft(data.template));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleInject = () => {
    if (!draft.htmlContent.trim()) {
      toast.error('Template HTML is empty');
      return;
    }
    onInject({
      subject: draft.subject,
      htmlContent: draft.htmlContent,
    });
    toast.success('Template injected into compose');
    onOpenChange(false);
  };

  const previewHtml = useMemo(
    () => sanitizeEmailHtml(draft.htmlContent || '<p></p>'),
    [draft.htmlContent]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close template picker"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        className="relative flex h-[min(88vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 id="template-picker-title" className="font-heading text-lg font-semibold text-text-primary">
              Email templates
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Choose a template, edit it, preview, then inject into your message.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Template list */}
          <aside className="flex w-full shrink-0 flex-col border-b border-border-subtle md:w-[240px] md:border-b-0 md:border-r">
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Templates
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {templatesQuery.isLoading && (
                <p className="px-2 py-4 text-xs text-text-muted">Loading templates…</p>
              )}
              {templatesQuery.isError && (
                <p className="px-2 py-4 text-xs text-red-400">Failed to load templates.</p>
              )}
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => selectTemplate(tpl)}
                  className={cn(
                    'mb-1 flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                    selectedId === tpl.id
                      ? 'bg-accent-blue/10 ring-1 ring-accent-blue/30'
                      : 'hover:bg-bg-overlay'
                  )}
                >
                  <FileText
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      selectedId === tpl.id ? 'text-accent-blue' : 'text-text-muted'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text-primary">{tpl.name}</p>
                    <p className="truncate text-[11px] text-text-muted">
                      {tpl.isPredefined ? 'Built-in' : 'Custom'} · {tpl.subject || 'No subject'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Editor + preview */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!selectedTemplate ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-text-muted">
                Select a template to edit and preview.
              </div>
            ) : (
              <>
                <div className="shrink-0 space-y-3 border-b border-border-subtle px-4 py-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-text-muted">
                        Template name
                      </label>
                      <Input
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        disabled={selectedTemplate.isPredefined}
                        className="h-9 bg-bg-surface text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-text-muted">
                        Subject line
                      </label>
                      <Input
                        value={draft.subject}
                        onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                        placeholder="Email subject"
                        className="h-9 bg-bg-surface text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1 rounded-lg border border-border-subtle bg-bg-surface p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => setEditorTab('edit')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        editorTab === 'edit'
                          ? 'bg-bg-elevated text-text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      )}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Edit HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        editorTab === 'preview'
                          ? 'bg-bg-elevated text-text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden p-4">
                  {editorTab === 'edit' ? (
                    <textarea
                      value={draft.htmlContent}
                      onChange={(e) => setDraft((d) => ({ ...d, htmlContent: e.target.value }))}
                      spellCheck={false}
                      className="h-full min-h-[200px] w-full resize-none rounded-lg border border-border-subtle bg-bg-surface p-3 font-mono text-[12px] leading-relaxed text-text-primary outline-none focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20"
                      placeholder="<!doctype html>..."
                    />
                  ) : (
                    <div className="flex h-full min-h-[200px] flex-col overflow-hidden rounded-lg border border-border-subtle bg-white">
                      <div className="shrink-0 border-b border-border-subtle bg-bg-surface px-3 py-2">
                        <p className="text-[11px] font-medium text-text-muted">Live preview</p>
                      </div>
                      <iframe
                        title="Template preview"
                        className="min-h-0 w-full flex-1 border-none bg-white"
                        sandbox="allow-same-origin"
                        srcDoc={previewHtml}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-bg-surface px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {!selectedTemplate?.isPredefined && selectedTemplate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                <Save className="h-3.5 w-3.5" />
                Save changes
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveAsNewMutation.isPending}
              onClick={() => saveAsNewMutation.mutate()}
            >
              <Save className="h-3.5 w-3.5" />
              Save as new
            </Button>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedTemplate || !draft.htmlContent.trim()}
              onClick={handleInject}
              className="bg-accent-blue text-white hover:bg-accent-blue-dim"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Inject into compose
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
