import type { UserKeyOverrides } from '@/lib/keyboard/types';

export const KEYBINDINGS_API = '/api/user/keybindings';

export async function fetchUserKeybindings(): Promise<UserKeyOverrides> {
  const res = await fetch(KEYBINDINGS_API);
  if (!res.ok) return {};
  const data = await res.json().catch(() => ({}));
  return (data.overrides ?? {}) as UserKeyOverrides;
}

export async function saveUserKeybindings(
  overrides: UserKeyOverrides
): Promise<UserKeyOverrides> {
  const res = await fetch(KEYBINDINGS_API, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) throw new Error('Failed to save keybindings');
  const data = await res.json();
  return (data.overrides ?? overrides) as UserKeyOverrides;
}

export async function patchUserKeybindings(
  merge: UserKeyOverrides
): Promise<UserKeyOverrides> {
  const res = await fetch(KEYBINDINGS_API, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merge }),
  });
  if (!res.ok) throw new Error('Failed to update keybindings');
  const data = await res.json();
  return (data.overrides ?? merge) as UserKeyOverrides;
}

export async function deleteUserKeybinding(bindingId: string): Promise<UserKeyOverrides> {
  const res = await fetch(KEYBINDINGS_API, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bindingId }),
  });
  if (!res.ok) throw new Error('Failed to remove keybinding');
  const data = await res.json();
  return (data.overrides ?? {}) as UserKeyOverrides;
}
