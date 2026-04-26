import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  current = signal<ConfirmRequest | null>(null);

  ask(title: string, message: string, confirmLabel = 'Confirm', cancelLabel = 'Cancel'): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.current.set({ title, message, confirmLabel, cancelLabel, resolve });
    });
  }

  resolve(value: boolean) {
    const c = this.current();
    if (c) c.resolve(value);
    this.current.set(null);
  }
}
