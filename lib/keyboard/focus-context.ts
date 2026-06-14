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

const SCROLL_KEY_DIRECTION: Record<string, 'up' | 'down'> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  PageUp: 'up',
  PageDown: 'down',
};

export function getScrollableAncestor(el: Element | null): HTMLElement | null {
  if (!el) return null;

  let node: Element | null = el;
  while (node && node !== document.body) {
    if (!(node instanceof HTMLElement)) break;
    const { overflowY } = window.getComputedStyle(node);
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

export function canScrollVertically(
  el: HTMLElement,
  direction: 'up' | 'down'
): boolean {
  if (direction === 'down') {
    return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  }
  return el.scrollTop > 0;
}

export function shouldAllowNativeScroll(
  target: Element | null,
  key: string
): boolean {
  const direction = SCROLL_KEY_DIRECTION[key];
  if (!direction) return false;

  const scrollEl = getScrollableAncestor(target);
  if (!scrollEl) return false;

  return canScrollVertically(scrollEl, direction);
}
