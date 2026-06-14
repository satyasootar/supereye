'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileSection } from '@/components/profile/profile-section';

type DeleteAccountSectionProps = {
  email: string | null;
};

export function DeleteAccountSection({ email }: DeleteAccountSectionProps) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm =
    !!email && confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();

  const resetDialog = () => {
    setConfirmEmail('');
    setError(null);
    setDeleting(false);
  };

  const handleDelete = async () => {
    if (!canConfirm) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: confirmEmail.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Failed to delete account'
        );
      }

      setOpen(false);
      await signOut({ callbackUrl: '/' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <>
      <ProfileSection
        title="Delete account"
        description="Permanently remove your account and all associated data."
      >
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-text-primary">
                This action cannot be undone
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
                Deletes your profile, workspaces, cached emails and calendar events,
                chat history, integrations, and OAuth connections from our database.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => {
                  resetDialog();
                  setOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete my account
              </Button>
            </div>
          </div>
        </div>
      </ProfileSection>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetDialog();
        }}
      >
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              All of your data will be permanently removed from Supereye. Type your
              email address to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-delete-email" className="text-[12px] font-medium text-text-secondary">
              Confirm email
            </label>
            <input
              id="confirm-delete-email"
              type="email"
              autoComplete="off"
              placeholder={email ?? 'your@email.com'}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={deleting}
              className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:border-destructive/50 focus:ring-1 focus:ring-destructive/30"
            />
            {error && (
              <p className="text-[12px] text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canConfirm || deleting}
              onClick={() => void handleDelete()}
              className="gap-2"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
