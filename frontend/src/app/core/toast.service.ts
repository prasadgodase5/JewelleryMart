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

  /** Show an HTTP error toast with the most useful message we can extract. */
  apiError(err: any, fallback = 'Request failed'): void {
    let msg = fallback;
    if (err?.status === 0) {
      msg = 'Cannot reach the backend. Run "npm start" in the backend folder.';
    } else if (err?.error?.error) {
      msg = err.error.error;
    } else if (err?.error?.hint) {
      msg = err.error.hint;
    } else if (typeof err?.error === 'string' && err.error.length < 200) {
      msg = err.error;
    } else if (err?.statusText && err.status) {
      msg = `${fallback} (${err.status} ${err.statusText})`;
    } else if (err?.message) {
      msg = err.message;
    }
    this.error(msg);
  }
}
