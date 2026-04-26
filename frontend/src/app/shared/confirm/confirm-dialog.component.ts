import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../core/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="confirm.current() as c" class="modal-backdrop" (click)="confirm.resolve(false)">
      <div class="modal-panel max-w-md" (click)="$event.stopPropagation()">
        <div class="p-5 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">{{ c.title }}</h3>
        </div>
        <div class="p-5 text-sm text-slate-700">{{ c.message }}</div>
        <div class="p-4 border-t border-slate-200 flex justify-end gap-2">
          <button class="btn btn-secondary" (click)="confirm.resolve(false)">{{ c.cancelLabel }}</button>
          <button class="btn btn-danger" (click)="confirm.resolve(true)">{{ c.confirmLabel }}</button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);
}
