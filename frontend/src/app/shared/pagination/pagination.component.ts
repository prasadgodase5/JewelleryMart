import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="totalPages > 1" class="flex items-center justify-between text-sm mt-3 flex-wrap gap-2">
      <span class="text-slate-500">Page {{ page }} of {{ totalPages }} · {{ total }} items</span>
      <div class="flex items-center gap-1">
        <button class="btn btn-secondary px-3 py-1 text-xs" [disabled]="page===1" (click)="go(page-1)">Prev</button>
        <button *ngFor="let p of pages()"
                class="btn px-3 py-1 text-xs"
                [ngClass]="p===page ? 'btn-primary' : 'btn-secondary'"
                (click)="go(p)">{{ p }}</button>
        <button class="btn btn-secondary px-3 py-1 text-xs" [disabled]="page===totalPages" (click)="go(page+1)">Next</button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages() { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

  pages(): number[] {
    const max = this.totalPages;
    const around = 2;
    const start = Math.max(1, this.page - around);
    const end = Math.min(max, this.page + around);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  go(p: number) {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.pageChange.emit(p);
  }
}
