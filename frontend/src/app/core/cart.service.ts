import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Product } from '../models/models';
import { AuthService } from './auth.service';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image?: string;
  qty: number;
  stock: number;
}

const KEY_PREFIX = 'pg_emart_cart_';

@Injectable({ providedIn: 'root' })
export class CartService {
  private auth = inject(AuthService);

  items = signal<CartItem[]>([]);

  count    = computed<number>(() => this.items().reduce((s, i) => s + i.qty, 0));
  subtotal = computed<number>(() => this.items().reduce((s, i) => s + i.qty * i.price, 0));
  isEmpty  = computed<boolean>(() => this.items().length === 0);

  private currentKey = computed<string>(() => KEY_PREFIX + (this.auth.username() || 'guest'));

  constructor() {
    // Load whenever the auth user changes
    effect(() => {
      const key = this.currentKey();
      try {
        const raw = localStorage.getItem(key);
        this.items.set(raw ? (JSON.parse(raw) as CartItem[]) : []);
      } catch {
        this.items.set([]);
      }
    }, { allowSignalWrites: true });

    // Persist on every change
    effect(() => {
      const key = this.currentKey();
      try { localStorage.setItem(key, JSON.stringify(this.items())); } catch {}
    });
  }

  add(product: Product, qty = 1): void {
    if (!product.id) return;
    const list = [...this.items()];
    const existing = list.find(i => i.productId === product.id);
    const targetQty = (existing?.qty || 0) + qty;
    const cappedQty = Math.min(targetQty, Math.max(0, product.stock));
    if (cappedQty <= 0) return;

    if (existing) {
      existing.qty = cappedQty;
      existing.stock = product.stock;
      existing.price = product.price;
      existing.name = product.name;
      existing.image = product.image;
    } else {
      list.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: cappedQty,
        stock: product.stock
      });
    }
    this.items.set(list);
  }

  setQty(productId: number, qty: number): void {
    const list = this.items().map(i => {
      if (i.productId !== productId) return i;
      const next = Math.max(1, Math.min(qty, i.stock || 99));
      return { ...i, qty: next };
    });
    this.items.set(list);
  }

  remove(productId: number): void {
    this.items.set(this.items().filter(i => i.productId !== productId));
  }

  clear(): void {
    this.items.set([]);
  }

  hasProduct(productId: number): boolean {
    return this.items().some(i => i.productId === productId);
  }

  qtyOf(productId: number): number {
    return this.items().find(i => i.productId === productId)?.qty ?? 0;
  }
}
