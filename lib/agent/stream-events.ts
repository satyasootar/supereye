import type { AgentStep } from '@/lib/store/app-store';

export type AgentStreamEvent =
  | { type: 'step'; step: AgentStep }
  | { type: 'step-update'; id: string; patch: Partial<AgentStep> }
  | { type: 'text-start'; messageId: string }
  | { type: 'text-delta'; delta: string }
  | { type: 'text-end' }
  | { type: 'error'; error: string }
  | { type: 'done' };

export class AgentStepEmitter {
  private counter = 0;
  private runningId: string | null = null;

  constructor(private emit: (event: AgentStreamEvent) => void) {}

  push(label: string, status: AgentStep['status'] = 'running'): string {
    if (status === 'running' && this.runningId) {
      this.emit({
        type: 'step-update',
        id: this.runningId,
        patch: { status: 'done' },
      });
    }

    const id = `step-${this.counter++}`;
    const step: AgentStep = { id, label, status };
    this.emit({ type: 'step', step });

    if (status === 'running') this.runningId = id;
    else this.runningId = null;

    return id;
  }

  update(id: string, patch: Partial<AgentStep>) {
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
