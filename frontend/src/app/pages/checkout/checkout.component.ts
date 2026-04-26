import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { AuthService } from '../../core/auth.service';
import { Order } from '../../models/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  payeeVpa = 'pgemart@upi';
  payeeName = 'PG E-Mart';

  form: FormGroup = this.fb.group({
    customer: [this.auth.username() || '', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    amount:   [100, [Validators.required, Validators.min(1), Validators.max(1_000_000)]]
  });

  ordersBackLink = computed<string>(() =>
    this.auth.role() === 'admin' ? '/admin/orders' : '/user/orders'
  );

  submitted = signal<boolean>(false);
  order = signal<Order | null>(null);
  qrDataUrl = signal<string>('');
  remaining = signal<number>(300);
  paying = signal<boolean>(false);
  paymentEnabled = signal<boolean>(false);
  expired = computed(() => this.remaining() <= 0 && this.order()?.status !== 'Paid');

  private intervalId: any = null;
  private expiredFlagged = false;

  upiUri = computed<string>(() => {
    const o = this.order();
    if (!o) return '';
    const params = new URLSearchParams({
      pa: this.payeeVpa,
      pn: this.payeeName,
      am: String(o.amount),
      cu: 'INR',
      tn: `Order ${o.id}`
    });
    return `upi://pay?${params.toString()}`;
  });

  mmss = computed<string>(() => {
    const r = Math.max(0, this.remaining());
    const m = Math.floor(r / 60);
    const s = r % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  ngOnInit(): void {
    this.api.paymentConfig().subscribe({
      next: cfg => this.paymentEnabled.set(!!cfg.enabled),
      error: () => this.paymentEnabled.set(false)
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getOrder(+id).subscribe({
        next: o => this.bindOrder(o),
        error: () => this.toast.error('Order not found')
      });
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  hasError(ctrlName: string, errKey?: string): boolean {
    const c = this.form.get(ctrlName);
    if (!c) return false;
    const touched = c.touched || c.dirty || this.submitted();
    if (!touched) return false;
    return errKey ? c.hasError(errKey) : c.invalid;
  }

  createOrder(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Please fix the highlighted fields');
      return;
    }
    const payload: Order = {
      customer: this.form.value.customer!,
      amount: Number(this.form.value.amount),
      items: [],
      status: 'Pending',
      paymentMode: 'UPI'
    };
    this.api.createOrder(payload).subscribe({
      next: o => { this.toast.success(`Order #${o.id} created`); this.bindOrder(o); },
      error: () => this.toast.error('Failed to create order')
    });
  }

  private bindOrder(o: Order): void {
    this.order.set(o);
    this.remaining.set(300);
    this.expiredFlagged = false;
    this.generateQr();
    if (o.status === 'Pending') this.startTimer();
  }

  private async generateQr(): Promise<void> {
    try {
      const url = await QRCode.toDataURL(this.upiUri(), { width: 320, margin: 1 });
      this.qrDataUrl.set(url);
    } catch {
      this.toast.error('QR generation failed');
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      const next = this.remaining() - 1;
      this.remaining.set(next);
      if (next <= 0) {
        this.stopTimer();
        this.flagExpired();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private flagExpired(): void {
    const o = this.order();
    if (!o || o.status === 'Paid' || this.expiredFlagged) return;
    this.expiredFlagged = true;
    this.api.expirePayment(o.id!).subscribe({
      next: updated => {
        this.order.set(updated);
        this.toast.warn('Payment window expired');
      },
      error: () => {}
    });
  }

  payNow(): void {
    const o = this.order();
    if (!o) return;
    if (!this.paymentEnabled()) {
      this.toast.error('Razorpay not configured. Add API keys to backend/.env');
      return;
    }
    if (typeof (window as any).Razorpay !== 'function') {
      this.toast.error('Payment SDK not loaded yet. Please retry in a moment.');
      return;
    }
    if (this.paying()) return;
    this.paying.set(true);

    this.api.createPaymentOrder(o.id!).subscribe({
      next: rp => this.openRazorpayCheckout(rp, o),
      error: err => {
        this.paying.set(false);
        const msg = err?.error?.error || 'Failed to start payment';
        const hint = err?.error?.hint;
        this.toast.error(hint ? `${msg} — ${hint}` : msg);
      }
    });
  }

  private openRazorpayCheckout(rp: { keyId: string; orderId: string; amount: number; currency: string; localOrderId: number; customer: string }, localOrder: Order): void {
    const opts: RazorpayOptions = {
      key: rp.keyId,
      amount: rp.amount,
      currency: rp.currency,
      name: 'PG E-Mart',
      description: `Order #${localOrder.id}`,
      order_id: rp.orderId,
      prefill: {
        name: rp.customer || this.auth.username(),
        contact: this.auth.phone()
      },
      theme: { color: '#6366f1' },
      method: { upi: true, card: true, netbanking: true, wallet: true },
      handler: (resp: RazorpayHandlerResponse) => {
        this.api.verifyPayment({
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
          localOrderId: rp.localOrderId
        }).subscribe({
          next: updated => {
            this.order.set(updated);
            this.stopTimer();
            this.paying.set(false);
            this.toast.success(`Payment successful · ${resp.razorpay_payment_id}`);
          },
          error: () => {
            this.paying.set(false);
            this.toast.error('Payment captured but verification failed. Contact support.');
          }
        });
      },
      modal: {
        ondismiss: () => {
          this.paying.set(false);
          this.toast.info('Payment cancelled');
        },
        escape: true
      }
    };

    try {
      const rz = new (window as any).Razorpay(opts);
      rz.on('payment.failed', (resp: any) => {
        this.paying.set(false);
        const reason = resp?.error?.description || 'Payment failed';
        this.toast.error(reason);
      });
      rz.open();
    } catch (e) {
      this.paying.set(false);
      this.toast.error('Could not open Razorpay checkout');
    }
  }

  reset(): void {
    this.order.set(null);
    this.qrDataUrl.set('');
    this.submitted.set(false);
    this.stopTimer();
    this.form.reset({ customer: this.auth.username() || '', amount: 100 });
  }

  paidBadgeClass(): string {
    const o = this.order();
    if (!o) return 'badge-slate';
    if (o.status === 'Paid') return 'badge-green';
    if (this.expired())      return 'badge-rose';
    return 'badge-amber';
  }
}
