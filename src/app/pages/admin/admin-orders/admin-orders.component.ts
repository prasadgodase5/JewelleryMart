import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { Order, PaymentStatus } from '../../../models/order.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent implements OnInit {
  private svc = inject(OrderService);

  loading = signal(true);
  error = signal<string | null>(null);
  filter = signal<'All' | PaymentStatus>('All');
  orders = signal<Order[]>([]);
  expanded = signal<string | null>(null);

  filtered = computed<Order[]>(() => {
    const f = this.filter();
    return f === 'All' ? this.orders() : this.orders().filter(o => o.paymentStatus === f);
  });

  stats = computed(() => {
    const list = this.orders();
    const sum = (s: PaymentStatus) => list.filter(o => o.paymentStatus === s).length;
    const revenue = list
      .filter(o => o.paymentStatus !== 'Cancelled')
      .reduce((t, o) => t + (o.totalAmount || 0), 0);
    return {
      total: list.length,
      pending: sum('Pending'),
      paid: sum('Paid'),
      completed: sum('Completed'),
      revenue
    };
  });

  ngOnInit(): void {
    this.svc.list()
      .pipe(catchError(e => { this.error.set(e?.message || 'Failed to load.'); return of([]); }))
      .subscribe(items => {
        this.orders.set(items);
        this.loading.set(false);
      });
  }

  setFilter(f: 'All' | PaymentStatus) { this.filter.set(f); }

  toggle(id?: string) {
    if (!id) return;
    this.expanded.set(this.expanded() === id ? null : id);
  }

  fmtDate(ts: any): string {
    if (!ts) return '—';
    const d: Date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async setStatus(o: Order, status: PaymentStatus): Promise<void> {
    if (!o.id) return;
    try {
      await this.svc.updateStatus(o.id, status);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to update status.');
    }
  }
}
