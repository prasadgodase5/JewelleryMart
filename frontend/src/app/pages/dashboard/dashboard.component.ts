import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Stats, Order, OrderStatus, Product } from '../../models/models';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  variant: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  stats = signal<Stats>({ products: 0, categories: 0, orders: 0, users: 0, revenue: 0, lowStock: 0 });
  recent = signal<Order[]>([]);
  lowStockItems = signal<Product[]>([]);

  cards = computed<StatCard[]>(() => [
    { label: 'Products',      value: this.stats().products,            icon: 'bi-box-seam',       variant: 'card-indigo' },
    { label: 'Categories',    value: this.stats().categories,          icon: 'bi-tags',           variant: 'card-emerald' },
    { label: 'Orders',        value: this.stats().orders,              icon: 'bi-receipt',        variant: 'card-amber' },
    { label: 'Revenue',       value: '₹' + this.stats().revenue,       icon: 'bi-currency-rupee', variant: 'card-rose' },
    { label: 'Users',         value: this.stats().users,               icon: 'bi-people',         variant: 'card-cyan' },
    { label: 'Low Stock',     value: this.stats().lowStock ?? 0,       icon: 'bi-exclamation-triangle', variant: 'card-warn' }
  ]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.api.stats().subscribe(s => this.stats.set(s));
    this.api.listOrders().subscribe(orders => {
      const sorted = orders.slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      this.recent.set(sorted.slice(0, 5));
    });
    this.api.listProducts().subscribe(ps => {
      const low = ps.filter(p => (p.stock ?? 0) <= 5).slice().sort((a, b) => (a.stock || 0) - (b.stock || 0));
      this.lowStockItems.set(low.slice(0, 6));
    });
  }

  badgeClass(status: OrderStatus | string): string {
    switch (status) {
      case 'Pending':   return 'badge-amber';
      case 'Shipped':   return 'badge-blue';
      case 'Delivered':
      case 'Paid':      return 'badge-green';
      case 'Expired':   return 'badge-rose';
      default:          return 'badge-slate';
    }
  }

  stockBadge(stock: number): string {
    if (stock <= 0) return 'badge-rose';
    if (stock <= 3) return 'badge-rose';
    if (stock <= 5) return 'badge-amber';
    return 'badge-green';
  }
}
