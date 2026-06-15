'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileSection, ProfileRow } from '@/components/profile/profile-section';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

type PasswordSectionProps = {
  hasPassword: boolean;
  email: string | null;
};

export function PasswordSection({ hasPassword, email }: PasswordSectionProps) {
  const router = useRouter();
  const [hasPasswordState, setHasPasswordState] = useState(hasPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          ...(hasPasswordState ? { currentPassword } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update password');
        return;
      }

      setSuccess(
        hasPasswordState ? 'Password updated successfully' : 'Password set successfully'
      );
      setHasPasswordState(true);
      router.refresh();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileSection
      title="Email & password"
      description={
        hasPasswordState
          ? 'Update the password you use to sign in with email.'
          : 'Add a password so you can sign in with email in addition to Google.'
      }
    >
      {!email && (
        <p className="text-[13px] text-destructive">
          Your account needs an email address before you can set a password.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {hasPasswordState && (
          <ProfileRow label="Current password" description="Required to change your password">
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="max-w-xs"
            />
          </ProfileRow>
        )}

        <ProfileRow
          label={hasPasswordState ? 'New password' : 'Password'}
          description={`At least ${MIN_PASSWORD_LENGTH} characters`}
        >
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            className="max-w-xs"
          />
        </ProfileRow>

        <ProfileRow label="Confirm password" description="Re-enter your new password">
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            className="max-w-xs"
          />
        </ProfileRow>

        {error && (
          <p className="text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-[13px] text-accent-blue" role="status">
            {success}
          </p>
        )}

        <div>
          <Button type="submit" disabled={loading || !email} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasPasswordState ? 'Update password' : 'Set password'}
          </Button>
        </div>
      </form>
    </ProfileSection>
  );
}
