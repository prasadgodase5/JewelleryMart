import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CustomerDetails } from '../../models/order.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  cart = inject(CartService);
  orderSvc = inject(OrderService);
  router = inject(Router);

  brand = environment.brand;
  payment = environment.payment;

  step = signal<1 | 2 | 3>(1); // 1: details, 2: payment, 3: success
  submitting = signal(false);
  error = signal<string | null>(null);
  orderId = signal<string | null>(null);

  details: CustomerDetails = { name: '', phone: '', address: '', email: '', notes: '' };

  get upiUrl(): string {
    const total = this.cart.total();
    return `upi://pay?pa=${encodeURIComponent(this.payment.upiId)}` +
           `&pn=${encodeURIComponent(this.payment.upiName)}` +
           `&am=${total}&cu=INR&tn=${encodeURIComponent('Creative Collection Order')}`;
  }

  goToPayment(form: NgForm): void {
    this.error.set(null);
    if (form.invalid) {
      this.error.set('Please fill in all required fields.');
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }
    if (this.cart.cart().length === 0) {
      this.error.set('Your cart is empty.');
      return;
    }
    this.step.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async confirmPaid(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);
    try {
      const id = await this.orderSvc.create({
        products: this.cart.cart(),
        totalAmount: this.cart.total(),
        userDetails: this.details,
        paymentStatus: 'Pending',
        paymentMethod: 'UPI'
      });
      this.orderId.set(id);
      this.cart.clear();
      this.step.set(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      this.error.set(e?.message ?? 'Could not place order. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
