import type { AgentAction } from '@/lib/store/app-store';

export type { AgentAction };

export type AgentStreamEvent =
  | { type: 'step'; step: import('@/lib/store/app-store').AgentStep }
  | { type: 'step-update'; id: string; patch: Partial<import('@/lib/store/app-store').AgentStep> }
  | { type: 'action'; action: AgentAction }
  | { type: 'action-update'; id: string; patch: Partial<AgentAction> }
  | { type: 'thread'; threadId: string }
  | { type: 'text-start'; messageId: string }
  | { type: 'text-delta'; delta: string }
  | { type: 'text-end' }
  | { type: 'error'; error: string }
  | { type: 'done' };

export class AgentStepEmitter {
  private counter = 0;
  private runningId: string | null = null;

  constructor(private emit: (event: AgentStreamEvent) => void) {}

  push(label: string, status: import('@/lib/store/app-store').AgentStep['status'] = 'running'): string {
    if (status === 'running' && this.runningId) {
      this.emit({
        type: 'step-update',
        id: this.runningId,
        patch: { status: 'done' },
      });
    }

    const id = `step-${this.counter++}`;
    const step = { id, label, status };
    this.emit({ type: 'step', step });

    if (status === 'running') this.runningId = id;
    else this.runningId = null;

    return id;
  }

  update(id: string, patch: Partial<import('@/lib/store/app-store').AgentStep>) {
    this.emit({ type: 'step-update', id, patch });
    if (patch.status === 'done' || patch.status === 'error') {
      if (this.runningId === id) this.runningId = null;
    }
  }

  completeRunning(label?: string) {
    if (!this.runningId) return;
    const id = this.runningId;
    this.emit({
      type: 'step-update',
      id,
      patch: { status: 'done', ...(label ? { label } : {}) },
    });
    this.runningId = null;
  }

  subStep(label: string) {
    this.completeRunning();
    return this.push(label, 'running');
  }
}

export class AgentActionEmitter {
  private counter = 0;

  constructor(private emit: (event: AgentStreamEvent) => void) {}

  start(action: Omit<AgentAction, 'id'> & { id?: string }): string {
    const id = action.id ?? `action-${this.counter++}`;
    this.emit({
      type: 'action',
      action: { ...action, id },
    });
    return id;
  }

  update(id: string, patch: Partial<AgentAction>) {
    this.emit({ type: 'action-update', id, patch });
  }

  complete(id: string, patch?: Partial<AgentAction>) {
    this.update(id, { status: 'done', ...patch });
  }

  fail(id: string, title: string) {
    this.update(id, { status: 'error', title });
  }
}
