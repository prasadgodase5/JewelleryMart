import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ConfirmDialogComponent } from '../shared/confirm/confirm-dialog.component';

interface NavItem { label: string; route: string; icon: string; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ConfirmDialogComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  today = new Date();
  sidebarOpen = signal(false);
  isSmallSig = signal(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  isSmall = () => this.isSmallSig();

  nav: NavItem[] = [
    { label: 'Dashboard',     route: '/dashboard',  icon: 'bi-speedometer2' },
    { label: 'Products',      route: '/products',   icon: 'bi-box-seam' },
    { label: 'Categories',    route: '/categories', icon: 'bi-tags' },
    { label: 'Orders',        route: '/orders',     icon: 'bi-receipt' },
    { label: 'Users',         route: '/users',      icon: 'bi-people' },
    { label: 'Checkout (UPI)', route: '/checkout',   icon: 'bi-credit-card-2-front' }
  ];

  @HostListener('window:resize')
  onResize() {
    this.isSmallSig.set(window.innerWidth < 1024);
    if (!this.isSmallSig()) this.sidebarOpen.set(false);
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  closeOnMobile() {
    if (this.isSmall()) this.sidebarOpen.set(false);
  }
}
