import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ConfirmDialogComponent } from '../shared/confirm/confirm-dialog.component';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { ToastService } from '../core/toast.service';

interface NavItem { label: string; route: string; icon: string; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ConfirmDialogComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  today = new Date();
  sidebarOpen = signal(false);
  userMenuOpen = signal(false);
  isSmallSig = signal(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  isSmall = () => this.isSmallSig();

  nav = computed<NavItem[]>(() => {
    if (this.auth.role() === 'admin') {
      return [
        { label: 'Dashboard',     route: '/admin/dashboard',  icon: 'bi-speedometer2' },
        { label: 'Products',      route: '/admin/products',   icon: 'bi-box-seam' },
        { label: 'Categories',    route: '/admin/categories', icon: 'bi-tags' },
        { label: 'Orders',        route: '/admin/orders',     icon: 'bi-receipt' },
        { label: 'Users',         route: '/admin/users',      icon: 'bi-people' },
        { label: 'UPI Checkout',  route: '/admin/checkout',   icon: 'bi-credit-card-2-front' }
      ];
    }
    return [
      { label: 'Shop',         route: '/user/shop',        icon: 'bi-shop' },
      { label: 'Add Product',  route: '/user/add-product', icon: 'bi-plus-circle' },
      { label: 'My Orders',    route: '/user/orders',      icon: 'bi-bag-check' }
    ];
  });

  pageTitle = computed<string>(() =>
    this.auth.role() === 'admin' ? 'Admin Console' : 'User Marketplace'
  );

  pageSubtitle = computed<string>(() =>
    this.auth.role() === 'admin'
      ? 'Manage products, categories, orders and users'
      : 'Browse, list and buy from PG E-Mart'
  );

  initial = computed<string>(() => (this.auth.username() || 'P').charAt(0).toUpperCase());

  @HostListener('window:resize')
  onResize() {
    this.isSmallSig.set(window.innerWidth < 1024);
    if (!this.isSmallSig()) this.sidebarOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const t = ev.target as HTMLElement;
    if (!t.closest('.user-menu-wrap')) this.userMenuOpen.set(false);
  }

  toggleSidebar() { this.sidebarOpen.set(!this.sidebarOpen()); }
  closeOnMobile() { if (this.isSmall()) this.sidebarOpen.set(false); }
  toggleUserMenu() { this.userMenuOpen.update(v => !v); }

  async logout(): Promise<void> {
    this.userMenuOpen.set(false);
    const ok = await this.confirm.ask('Sign out', 'Are you sure you want to sign out?', 'Sign out');
    if (!ok) return;
    this.auth.logout();
    this.toast.info('You have been signed out');
    this.router.navigate(['/']);
  }
}
