import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ConfirmDialogComponent } from '../shared/confirm/confirm-dialog.component';

interface NavItem { label: string; route: string; icon: string; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ConfirmDialogComponent],
  template: `
    <div class="min-h-screen flex">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200"
        [class.-translate-x-full]="!sidebarOpen() && isSmall()"
        [class.translate-x-0]="sidebarOpen() || !isSmall()">
        <div class="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <div class="w-8 h-8 rounded bg-brand-500 flex items-center justify-center font-bold">U</div>
          <div class="leading-tight">
            <div class="font-semibold">UNFYD.PIVOT</div>
            <div class="text-xs text-slate-400">Admin Panel</div>
          </div>
        </div>
        <nav class="flex-1 py-3 overflow-y-auto">
          <a *ngFor="let item of nav"
             [routerLink]="item.route"
             routerLinkActive="bg-slate-800 text-white border-l-4 border-brand-500"
             (click)="closeOnMobile()"
             class="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent">
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </nav>
        <div class="p-4 text-xs text-slate-500 border-t border-slate-800">
          v1.0 · {{ today | date:'mediumDate' }}
        </div>
      </aside>

      <!-- Mobile backdrop -->
      <div *ngIf="sidebarOpen() && isSmall()"
           class="fixed inset-0 bg-black/40 z-20 lg:hidden"
           (click)="sidebarOpen.set(false)"></div>

      <!-- Main -->
      <div class="flex-1 flex flex-col min-w-0">
        <header class="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button class="btn btn-ghost lg:hidden" (click)="sidebarOpen.set(!sidebarOpen())" aria-label="Toggle menu">
            <span class="text-xl">☰</span>
          </button>
          <div class="flex-1">
            <h1 class="text-lg font-semibold text-slate-800">Admin Dashboard</h1>
            <p class="text-xs text-slate-500 hidden sm:block">Manage products, categories, orders and users</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold">A</div>
            <span class="hidden sm:inline text-sm text-slate-700">Admin</span>
          </div>
        </header>

        <main class="flex-1 p-4 sm:p-6 max-w-full overflow-x-hidden">
          <ng-content></ng-content>
        </main>
      </div>
    </div>

    <app-confirm-dialog></app-confirm-dialog>
  `
})
export class LayoutComponent {
  today = new Date();
  sidebarOpen = signal(false);
  isSmallSig = signal(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  isSmall = () => this.isSmallSig();

  nav: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Products', route: '/products', icon: '📦' },
    { label: 'Categories', route: '/categories', icon: '🏷️' },
    { label: 'Orders', route: '/orders', icon: '🧾' },
    { label: 'Users', route: '/users', icon: '👥' },
    { label: 'Checkout (UPI)', route: '/checkout', icon: '💳' }
  ];

  @HostListener('window:resize')
  onResize() {
    this.isSmallSig.set(window.innerWidth < 1024);
    if (!this.isSmallSig()) this.sidebarOpen.set(false);
  }

  closeOnMobile() {
    if (this.isSmall()) this.sidebarOpen.set(false);
  }
}
