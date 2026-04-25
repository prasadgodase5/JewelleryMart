import { Injectable, signal } from '@angular/core';

export interface ContactDialogPrefill {
  subject?: string;
  productId?: string;
  productName?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactDialogService {
  private _open = signal(false);
  private _prefill = signal<ContactDialogPrefill>({});

  readonly open = this._open.asReadonly();
  readonly prefill = this._prefill.asReadonly();

  show(prefill: ContactDialogPrefill = {}): void {
    this._prefill.set(prefill);
    this._open.set(true);
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }

  close(): void {
    this._open.set(false);
    this._prefill.set({});
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }
}
