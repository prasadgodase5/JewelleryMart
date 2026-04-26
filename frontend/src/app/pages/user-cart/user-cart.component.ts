import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Order } from '../../models/models';

@Component({
  selector: 'app-user-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-cart.component.html',
  styleUrls: ['./user-cart.component.css']
})
export class UserCartComponent {
  cart = inject(CartService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private router = inject(Router);

  placing = signal<boolean>(false);

  // shipping fee waived above this threshold
  freeShippingFrom = 5000;
  shipping = computed<number>(() => this.cart.subtotal() === 0 || this.cart.subtotal() >= this.freeShippingFrom ? 0 : 99);
  total = computed<number>(() => this.cart.subtotal() + this.shipping());

  inc(productId: number): void {
    const item = this.cart.items().find(i => i.productId === productId);
    if (!item) return;
    if (item.qty >= item.stock) {
      this.toast.warn(`Only ${item.stock} in stock`);
      return;
    }
    this.cart.setQty(productId, item.qty + 1);
  }

  dec(productId: number): void {
    const item = this.cart.items().find(i => i.productId === productId);
    if (!item) return;
    if (item.qty <= 1) {
      this.remove(productId);
      return;
    }
    this.cart.setQty(productId, item.qty - 1);
  }

  setQtyManual(productId: number, raw: string): void {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) this.cart.setQty(productId, n);
  }

  async remove(productId: number): Promise<void> {
    const item = this.cart.items().find(i => i.productId === productId);
    if (!item) return;
    const ok = await this.confirm.ask('Remove item', `Remove "${item.name}" from cart?`, 'Remove');
    if (!ok) return;
    this.cart.remove(productId);
    this.toast.info('Removed from cart');
  }

  async clearAll(): Promise<void> {
    const ok = await this.confirm.ask('Clear cart', 'Remove all items from your cart?', 'Clear');
    if (!ok) return;
    this.cart.clear();
    this.toast.info('Cart cleared');
  }

  proceedToPay(): void {
    if (this.cart.isEmpty()) {
      this.toast.warn('Your cart is empty');
      return;
    }
    if (this.placing()) return;
    this.placing.set(true);

    const order: Order = {
      customer: this.auth.username(),
      items: this.cart.items().map(i => ({ productId: i.productId, qty: i.qty })),
      amount: this.total(),
      status: 'Pending',
      paymentMode: 'UPI'
    };

    this.api.createOrder(order).subscribe({
      next: created => {
        this.toast.success(`Order #${created.id} created — pay to confirm`);
        this.cart.clear();
        this.placing.set(false);
        this.router.navigate(['/user/checkout', created.id]);
      },
      error: () => {
        this.placing.set(false);
        this.toast.error('Failed to place order');
      }
    });
  }
}
