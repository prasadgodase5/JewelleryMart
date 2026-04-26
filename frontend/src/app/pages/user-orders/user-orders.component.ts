import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Order, OrderStatus } from '../../models/models';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.css']
})
export class UserOrdersComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  list = signal<Order[]>([]);
  filterStatus = signal<'' | OrderStatus>('');

  username = this.auth.username;

  myOrders = computed<Order[]>(() => {
    const me = this.username().toLowerCase();
    let mine = this.list().filter(o => (o.customer || '').toLowerCase() === me);
    if (this.filterStatus()) mine = mine.filter(o => o.status === this.filterStatus());
    return mine.slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  });

  totalSpent = computed<number>(() =>
    this.myOrders()
      .filter(o => o.status === 'Paid' || o.status === 'Delivered' || o.status === 'Shipped')
      .reduce((s, o) => s + (Number(o.amount) || 0), 0)
  );

  pendingCount = computed<number>(() =>
    this.myOrders().filter(o => o.status === 'Pending').length
  );

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.api.listOrders().subscribe(os => this.list.set(os));
  }

  setFilter(v: string): void {
    this.filterStatus.set(v as OrderStatus | '');
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

  isPayable(o: Order): boolean {
    return o.status === 'Pending';
  }

  async cancel(o: Order): Promise<void> {
    const ok = await this.confirm.ask(
      'Cancel order',
      `Cancel order #${o.id} for ₹${o.amount}? This cannot be undone.`,
      'Cancel order'
    );
    if (!ok) return;
    this.api.deleteOrder(o.id!).subscribe({
      next: () => { this.toast.success('Order cancelled'); this.refresh(); },
      error: () => this.toast.error('Failed to cancel')
    });
  }
}
