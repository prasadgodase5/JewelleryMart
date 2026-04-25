import { Injectable, signal, computed, effect } from '@angular/core';
import { CartItem } from '../models/cart-item.model';

const STORAGE_KEY = 'cc_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.load());

  readonly cart = this.items.asReadonly();
  readonly count = computed(() => this.items().reduce((n, i) => n + i.quantity, 0));
  readonly total = computed(() => this.items().reduce((s, i) => s + i.price * i.quantity, 0));

  constructor() {
    effect(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items())); } catch {}
    });
  }

  private load(): CartItem[] {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) as CartItem[] : [];
    } catch { return []; }
  }

  add(item: CartItem): void {
    const list = [...this.items()];
    const idx = list.findIndex(i => i.productId === item.productId);
    if (idx > -1) {
      list[idx] = { ...list[idx], quantity: list[idx].quantity + item.quantity };
    } else {
      list.push(item);
    }
    this.items.set(list);
  }

  setQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) return this.remove(productId);
    const list = this.items().map(i =>
      i.productId === productId ? { ...i, quantity } : i
    );
    this.items.set(list);
  }

  increment(productId: string): void {
    const item = this.items().find(i => i.productId === productId);
    if (item) this.setQuantity(productId, item.quantity + 1);
  }

  decrement(productId: string): void {
    const item = this.items().find(i => i.productId === productId);
    if (item) this.setQuantity(productId, item.quantity - 1);
  }

  remove(productId: string): void {
    this.items.set(this.items().filter(i => i.productId !== productId));
  }

  clear(): void {
    this.items.set([]);
  }
}
