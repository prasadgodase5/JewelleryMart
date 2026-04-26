import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Order, OrderStatus } from '../../models/models';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

type SortKey = 'newest' | 'oldest' | 'amountAsc' | 'amountDesc';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  list = signal<Order[]>([]);
  search = signal<string>('');
  statusFilter = signal<'' | OrderStatus>('');
  sortBy = signal<SortKey>('newest');
  page = signal<number>(1);
  pageSize = 10;

  filtered = computed<Order[]>(() => {
    let list = this.list();
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(o => o.customer.toLowerCase().includes(q) || String(o.id).includes(q));
    if (this.statusFilter()) list = list.filter(o => o.status === this.statusFilter());
    const s = this.sortBy();
    list = list.slice().sort((a, b) => {
      if (s === 'amountAsc')  return a.amount - b.amount;
      if (s === 'amountDesc') return b.amount - a.amount;
      if (s === 'oldest')     return (a.createdAt || '').localeCompare(b.createdAt || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return list;
  });

  paged = computed<Order[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.api.listOrders().subscribe(os => this.list.set(os));
  }

  setSearch(v: string)        { this.search.set(v); this.page.set(1); }
  setStatusFilter(v: string)  { this.statusFilter.set(v as OrderStatus | ''); this.page.set(1); }
  setSort(v: string)          { this.sortBy.set(v as SortKey); }

  statusBg(s: OrderStatus): string {
    return {
      'Pending':   'bg-pending',
      'Paid':      'bg-paid',
      'Shipped':   'bg-shipped',
      'Delivered': 'bg-delivered',
      'Expired':   'bg-expired'
    }[s] || '';
  }

  badgeClass(s: OrderStatus | string): string {
    switch (s) {
      case 'Pending':   return 'badge-amber';
      case 'Shipped':   return 'badge-blue';
      case 'Delivered':
      case 'Paid':      return 'badge-green';
      case 'Expired':   return 'badge-rose';
      default:          return 'badge-slate';
    }
  }

  changeStatus(o: Order, status: OrderStatus): void {
    this.api.updateOrder(o.id!, { status }).subscribe({
      next: () => { this.toast.success(`Order #${o.id} → ${status}`); this.refresh(); },
      error: () => this.toast.error('Update failed')
    });
  }

  async remove(o: Order): Promise<void> {
    const ok = await this.confirm.ask(
      'Delete order',
      `Delete order #${o.id} for ${o.customer}? This cannot be undone.`,
      'Delete'
    );
    if (!ok) return;
    this.api.deleteOrder(o.id!).subscribe({
      next: () => { this.toast.success('Order deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
