import { useAppStore } from '@/lib/store/app-store';

export function parseEmailLink(link: string | null | undefined): string | null {
  if (!link?.startsWith('/emails/')) return null;
  const id = link.slice('/emails/'.length).split(/[?#]/)[0]?.trim();
  return id || null;
}

/** Open the email plugin and select a message from a notification or search link. */
export function navigateToEmailFromLink(link: string | null | undefined): boolean {
  const emailId = parseEmailLink(link);
  if (!emailId) return false;

  const store = useAppStore.getState();
  store.setLayoutMode('email');
  store.setEmailCategory('INBOX');
  store.setSelectedEmailId(emailId);
  return true;
}
