import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Stats, Order } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let c of cards()" class="card flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" [ngClass]="c.bg">{{ c.icon }}</div>
          <div>
            <div class="text-xs text-slate-500 uppercase">{{ c.label }}</div>
            <div class="text-2xl font-semibold text-slate-800">{{ c.value }}</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="card lg:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-slate-800">Recent Orders</h3>
            <a routerLink="/orders" class="text-sm text-brand-500 hover:underline">View all</a>
          </div>
          <div class="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of recent()">
                  <td class="font-medium">#{{ o.id }}</td>
                  <td>{{ o.customer }}</td>
                  <td>₹{{ o.amount }}</td>
                  <td>
                    <span class="badge" [ngClass]="statusClass(o.status)">{{ o.status }}</span>
                  </td>
                  <td class="text-slate-500 text-xs">{{ o.createdAt | date:'short' }}</td>
                </tr>
                <tr *ngIf="!recent().length"><td colspan="5" class="text-center text-slate-400 py-6">No orders yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-slate-800 mb-3">Quick Actions</h3>
          <div class="space-y-2">
            <a routerLink="/products" class="btn btn-secondary w-full justify-start">📦 Manage Products</a>
            <a routerLink="/categories" class="btn btn-secondary w-full justify-start">🏷️ Manage Categories</a>
            <a routerLink="/orders" class="btn btn-secondary w-full justify-start">🧾 View Orders</a>
            <a routerLink="/users" class="btn btn-secondary w-full justify-start">👥 Manage Users</a>
            <a routerLink="/checkout" class="btn btn-primary w-full justify-start">💳 Test UPI Checkout</a>
          </div>
        </div>
      </div>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<Stats>({ products: 0, categories: 0, orders: 0, users: 0, revenue: 0 });
  recent = signal<Order[]>([]);

  cards = () => [
    { label: 'Products', value: this.stats().products, icon: '📦', bg: 'bg-indigo-100 text-indigo-600' },
    { label: 'Categories', value: this.stats().categories, icon: '🏷️', bg: 'bg-emerald-100 text-emerald-600' },
    { label: 'Orders', value: this.stats().orders, icon: '🧾', bg: 'bg-amber-100 text-amber-600' },
    { label: 'Revenue', value: '₹' + this.stats().revenue, icon: '💰', bg: 'bg-rose-100 text-rose-600' }
  ];

  ngOnInit() {
    this.api.stats().subscribe(s => this.stats.set(s));
    this.api.listOrders().subscribe(orders => {
      this.recent.set(orders.slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).slice(0, 5));
    });
  }

  statusClass(s: string) {
    return {
      'Pending': 'bg-amber-100 text-amber-700',
      'Shipped': 'bg-blue-100 text-blue-700',
      'Delivered': 'bg-emerald-100 text-emerald-700',
      'Paid': 'bg-emerald-100 text-emerald-700',
      'Expired': 'bg-rose-100 text-rose-700'
    }[s] || 'bg-slate-100 text-slate-600';
  }
}
