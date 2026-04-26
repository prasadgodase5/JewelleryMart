import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Order, OrderStatus } from '../../models/models';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-semibold text-slate-800">Orders</h2>
        <a routerLink="/checkout" class="btn btn-primary">+ New UPI Checkout</a>
      </div>

      <div class="card">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input class="input" placeholder="Search by customer or ID…" [value]="search()" (input)="search.set($any($event.target).value); page.set(1)">
          <select class="input" [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value); page.set(1)">
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Expired">Expired</option>
          </select>
          <select class="input" [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="amountDesc">Sort: Amount ↓</option>
            <option value="amountAsc">Sort: Amount ↑</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr><th>#</th><th>Customer</th><th>Amount</th><th>Mode</th><th>Status</th><th>Date</th><th class="text-right">Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of paged()">
                <td class="font-medium">#{{ o.id }}</td>
                <td>{{ o.customer }}</td>
                <td>₹{{ o.amount }}</td>
                <td>{{ o.paymentMode || '—' }}</td>
                <td>
                  <select [value]="o.status" (change)="changeStatus(o, $any($event.target).value)" class="input py-1 text-xs"
                          [ngClass]="statusBg(o.status)">
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Expired">Expired</option>
                  </select>
                </td>
                <td class="text-slate-500 text-xs">{{ o.createdAt | date:'short' }}</td>
                <td class="text-right whitespace-nowrap">
                  <a [routerLink]="['/checkout', o.id]" class="btn btn-ghost text-sm">UPI</a>
                  <button class="btn btn-ghost text-sm text-red-600" (click)="remove(o)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="!paged().length"><td colspan="7" class="text-center text-slate-400 py-8">No orders</td></tr>
            </tbody>
          </table>
        </div>

        <app-pagination [total]="filtered().length" [page]="page()" [pageSize]="pageSize" (pageChange)="page.set($event)"></app-pagination>
      </div>
    </section>
  `
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  list = signal<Order[]>([]);
  search = signal('');
  statusFilter = signal<'' | OrderStatus>('');
  sortBy = signal<'newest' | 'oldest' | 'amountAsc' | 'amountDesc'>('newest');
  page = signal(1);
  pageSize = 10;

  filtered = computed(() => {
    let list = this.list();
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(o => o.customer.toLowerCase().includes(q) || String(o.id).includes(q));
    if (this.statusFilter()) list = list.filter(o => o.status === this.statusFilter());
    const s = this.sortBy();
    list = list.slice().sort((a, b) => {
      if (s === 'amountAsc') return a.amount - b.amount;
      if (s === 'amountDesc') return b.amount - a.amount;
      if (s === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return list;
  });

  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit() { this.refresh(); }

  refresh() { this.api.listOrders().subscribe(os => this.list.set(os)); }

  statusBg(s: OrderStatus) {
    return {
      'Pending': 'bg-amber-50',
      'Paid': 'bg-emerald-50',
      'Shipped': 'bg-blue-50',
      'Delivered': 'bg-emerald-50',
      'Expired': 'bg-rose-50'
    }[s] || '';
  }

  changeStatus(o: Order, status: OrderStatus) {
    this.api.updateOrder(o.id!, { status }).subscribe({
      next: () => { this.toast.success(`Order #${o.id} → ${status}`); this.refresh(); },
      error: () => this.toast.error('Update failed')
    });
  }

  async remove(o: Order) {
    const ok = await this.confirm.ask('Delete order', `Delete order #${o.id}?`, 'Delete');
    if (!ok) return;
    this.api.deleteOrder(o.id!).subscribe({
      next: () => { this.toast.success('Deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
