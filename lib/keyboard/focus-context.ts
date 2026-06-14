import type { FocusMode } from '@/lib/keyboard/types';

const EDITOR_SELECTORS = [
  '[data-keyboard-opt-out]',
  '.cm-editor',
  '.monaco-editor',
  '.ql-editor',
  '.ProseMirror',
  '[contenteditable="true"]',
];

export function isEditableElement(el: Element | null): boolean {
  if (!el || !('tagName' in el)) return false;
  const htmlEl = el as HTMLElement;
  if (htmlEl.isContentEditable) return true;
  const tag = htmlEl.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    const input = htmlEl as HTMLInputElement;
    if (input.type === 'checkbox' || input.type === 'radio' || input.type === 'button') {
      return false;
    }
    return true;
  }
  if (typeof htmlEl.closest !== 'function') return false;
  return EDITOR_SELECTORS.some((sel) => htmlEl.closest(sel));
}

export function isThirdPartyEditorRoot(el: Element | null): boolean {
  if (!el || !('tagName' in el) || typeof (el as HTMLElement).closest !== 'function') {
    return false;
  }
  const htmlEl = el as HTMLElement;
  return EDITOR_SELECTORS.some((sel) => htmlEl.matches(sel) || !!htmlEl.closest(sel));
}

export function resolveFocusMode(
  activeElement: Element | null,
  modalDepth: number
): FocusMode {
  if (modalDepth > 0) return 'modal';
  if (isEditableElement(activeElement)) return 'insert';
  return 'command';
}

export function eventHasModifier(e: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey'>) {
  return e.ctrlKey || e.metaKey;
}
