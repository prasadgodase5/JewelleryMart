import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="modal-backdrop" (click)="close.emit()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">{{ title }}</h3>
          <button class="text-slate-500 hover:text-slate-800 text-xl leading-none" (click)="close.emit()" aria-label="Close">×</button>
        </div>
        <div class="p-5">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}
