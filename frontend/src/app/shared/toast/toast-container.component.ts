import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[200] space-y-2 w-[calc(100vw-2rem)] sm:w-80">
      <div *ngFor="let t of toast.toasts()"
           class="px-4 py-3 rounded-md shadow-lg text-sm text-white flex items-start gap-2 animate-in fade-in slide-in-from-right-5"
           [ngClass]="{
             'bg-emerald-600': t.kind==='success',
             'bg-red-600': t.kind==='error',
             'bg-amber-500': t.kind==='warn',
             'bg-slate-700': t.kind==='info'
           }">
        <span class="flex-1">{{ t.message }}</span>
        <button (click)="toast.dismiss(t.id)" class="opacity-80 hover:opacity-100" aria-label="Dismiss">×</button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  toast = inject(ToastService);
}
