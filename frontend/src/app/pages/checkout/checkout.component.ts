import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
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

  payeeVpa = 'merchant@upi';
  payeeName = 'UNFYD Store';

  form: FormGroup = this.fb.group({
    customer: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    amount:   [100, [Validators.required, Validators.min(1), Validators.max(1_000_000)]]
  });

  submitted = signal<boolean>(false);
  order = signal<Order | null>(null);
  qrDataUrl = signal<string>('');
  remaining = signal<number>(300);
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

  confirmPaid(): void {
    const o = this.order();
    if (!o) return;
    this.api.confirmPayment(o.id!).subscribe({
      next: updated => {
        this.order.set(updated);
        this.toast.success('Payment confirmed');
        this.stopTimer();
      },
      error: () => this.toast.error('Confirmation failed')
    });
  }

  reset(): void {
    this.order.set(null);
    this.qrDataUrl.set('');
    this.submitted.set(false);
    this.stopTimer();
    this.form.reset({ customer: '', amount: 100 });
  }

  paidBadgeClass(): string {
    const o = this.order();
    if (!o) return 'badge-slate';
    if (o.status === 'Paid') return 'badge-green';
    if (this.expired())      return 'badge-rose';
    return 'badge-amber';
  }
}
