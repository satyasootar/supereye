import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { navigateToEmailFromLink, parseEmailLink } from '../email.ts';
import { useAppStore } from '../../store/app-store.ts';

describe('parseEmailLink', () => {
  it('extracts google message id from email links', () => {
    assert.equal(parseEmailLink('/emails/19ecf1a4480d9606'), '19ecf1a4480d9606');
    assert.equal(parseEmailLink('/emails/19ecf1a4480d9606?ref=notif'), '19ecf1a4480d9606');
    assert.equal(parseEmailLink('/emails/19ecf1a4480d9606#section'), '19ecf1a4480d9606');
  });

  it('returns null for non-email links', () => {
    assert.equal(parseEmailLink('/workspace'), null);
    assert.equal(parseEmailLink(null), null);
    assert.equal(parseEmailLink('/emails/'), null);
  });
});

describe('navigateToEmailFromLink', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedEmailId: null,
      emailCategory: 'ALL',
      primaryPluginId: 'calendar',
      sidebarPluginId: 'email',
    });
  });

  it('opens email plugin and selects message', () => {
    const ok = navigateToEmailFromLink('/emails/msg-123');
    assert.equal(ok, true);

    const state = useAppStore.getState();
    assert.equal(state.selectedEmailId, 'msg-123');
    assert.equal(state.emailCategory, 'INBOX');
    assert.equal(state.primaryPluginId, 'email');
  });

  it('returns false for invalid links', () => {
    const ok = navigateToEmailFromLink('/workspace/brief');
    assert.equal(ok, false);
    assert.equal(useAppStore.getState().selectedEmailId, null);
  });
});
