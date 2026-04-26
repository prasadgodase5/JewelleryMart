import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'warn';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  toasts = signal<Toast[]>([]);

  show(message: string, kind: ToastKind = 'info', timeoutMs = 3000) {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), timeoutMs);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string) { this.show(msg, 'error', 4500); }
  info(msg: string) { this.show(msg, 'info'); }
  warn(msg: string) { this.show(msg, 'warn'); }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
