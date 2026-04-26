import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Order } from '../../models/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="space-y-4 max-w-3xl mx-auto">
      <h2 class="text-xl font-semibold text-slate-800">UPI Checkout</h2>

      <!-- Step 1: enter / select order -->
      <div *ngIf="!order()" class="card space-y-3">
        <p class="text-sm text-slate-600">Create a new order to generate a UPI QR, or open an existing pending order from the Orders page.</p>
        <form [formGroup]="form" (ngSubmit)="createOrder()" class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="label">Customer Name *</label>
            <input class="input" formControlName="customer" placeholder="Customer name">
          </div>
          <div>
            <label class="label">Amount (₹) *</label>
            <input class="input" type="number" min="1" formControlName="amount">
          </div>
          <div class="sm:col-span-2 flex justify-end gap-2">
            <a routerLink="/orders" class="btn btn-secondary">Cancel</a>
            <button class="btn btn-primary" [disabled]="form.invalid">Generate UPI QR</button>
          </div>
        </form>
      </div>

      <!-- Step 2: QR + countdown -->
      <div *ngIf="order() as o" class="card">
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="text-sm text-slate-500">Order #</div>
            <div class="text-xl font-semibold">#{{ o.id }} · {{ o.customer }}</div>

            <div class="bg-brand-50 border border-brand-100 rounded-lg p-4">
              <div class="text-xs text-brand-700 uppercase">Total Amount</div>
              <div class="text-3xl font-bold text-brand-700">₹{{ o.amount }}</div>
            </div>

            <div class="text-sm text-slate-700">
              <p class="font-medium mb-1">How to pay</p>
              <ol class="list-decimal pl-5 space-y-1 text-slate-600">
                <li>Scan the QR using any UPI app (GPay, PhonePe, Paytm)</li>
                <li>Complete the payment</li>
                <li>Tap "I Have Paid" below</li>
              </ol>
            </div>

            <div class="rounded-lg p-3 flex items-center justify-between"
                 [ngClass]="expired() ? 'bg-rose-50 border border-rose-200' : 'bg-amber-50 border border-amber-200'">
              <div>
                <div class="text-xs uppercase" [ngClass]="expired() ? 'text-rose-700' : 'text-amber-700'">Time remaining</div>
                <div class="text-2xl font-mono font-semibold" [ngClass]="expired() ? 'text-rose-700' : 'text-amber-700'">{{ mmss() }}</div>
              </div>
              <span class="badge"
                    [ngClass]="o.status==='Paid' ? 'bg-emerald-100 text-emerald-700' : expired() ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">
                {{ o.status }}
              </span>
            </div>

            <div class="flex flex-wrap gap-2">
              <button class="btn btn-primary" (click)="confirmPaid()" [disabled]="o.status==='Paid' || expired()">I Have Paid</button>
              <button class="btn btn-secondary" (click)="reset()">New Order</button>
              <a routerLink="/orders" class="btn btn-ghost">Back to Orders</a>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center">
            <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <img *ngIf="qrDataUrl()" [src]="qrDataUrl()" alt="UPI QR" class="w-56 h-56 sm:w-64 sm:h-64">
              <div *ngIf="!qrDataUrl()" class="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-400 text-sm">Generating…</div>
            </div>
            <div class="text-xs text-slate-500 mt-2 break-all text-center max-w-xs">{{ upiUri() }}</div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  payeeVpa = 'merchant@upi';
  payeeName = 'UNFYD Store';

  form = this.fb.group({
    customer: ['', [Validators.required, Validators.minLength(2)]],
    amount: [100, [Validators.required, Validators.min(1)]]
  });

  order = signal<Order | null>(null);
  qrDataUrl = signal<string>('');
  remaining = signal<number>(300);
  expired = computed(() => this.remaining() <= 0 && this.order()?.status !== 'Paid');
  private intervalId: any = null;
  private expiredFlagged = false;

  upiUri = computed(() => {
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

  mmss = computed(() => {
    const r = Math.max(0, this.remaining());
    const m = Math.floor(r / 60);
    const s = r % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getOrder(+id).subscribe({
        next: o => this.bindOrder(o),
        error: () => this.toast.error('Order not found')
      });
    }
  }

  ngOnDestroy() { this.stopTimer(); }

  createOrder() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
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

  private bindOrder(o: Order) {
    this.order.set(o);
    this.remaining.set(300);
    this.expiredFlagged = false;
    this.generateQr();
    this.startTimer();
  }

  private async generateQr() {
    try {
      const url = await QRCode.toDataURL(this.upiUri(), { width: 320, margin: 1 });
      this.qrDataUrl.set(url);
    } catch {
      this.toast.error('QR generation failed');
    }
  }

  private startTimer() {
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

  private stopTimer() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  private flagExpired() {
    const o = this.order();
    if (!o || o.status === 'Paid' || this.expiredFlagged) return;
    this.expiredFlagged = true;
    this.api.expirePayment(o.id!).subscribe({
      next: updated => { this.order.set(updated); this.toast.warn('Payment window expired'); },
      error: () => {}
    });
  }

  confirmPaid() {
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

  reset() {
    this.order.set(null);
    this.qrDataUrl.set('');
    this.stopTimer();
    this.form.reset({ customer: '', amount: 100 });
  }
}
