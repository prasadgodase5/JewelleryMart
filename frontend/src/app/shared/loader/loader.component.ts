import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../core/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loader.visible()" class="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center pt-6">
      <div class="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-slate-200 pointer-events-auto">
        <span class="inline-block w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
        <span class="text-sm text-slate-700">Loading…</span>
      </div>
    </div>
  `
})
export class LoaderComponent {
  loader = inject(LoaderService);
}
