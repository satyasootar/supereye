import type { KeyboardActionId } from '@/lib/keyboard/action-ids';

export type ActionHandler = (
  bindingId: string,
  event: KeyboardEvent
) => void | Promise<void>;

const handlers = new Map<KeyboardActionId, ActionHandler>();

export function registerActionHandler(
  actionId: KeyboardActionId,
  handler: ActionHandler
) {
  handlers.set(actionId, handler);
  return () => handlers.delete(actionId);
}

export function dispatchAction(
  actionId: KeyboardActionId,
  bindingId: string,
  event: KeyboardEvent
) {
  const handler = handlers.get(actionId);
  if (handler) {
    void handler(bindingId, event);
    return true;
  }
  return false;
}

export function clearActionHandlers() {
  handlers.clear();
}
