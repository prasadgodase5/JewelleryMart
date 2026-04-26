import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { Product, Category, Order } from '../../models/models';

type SortKey = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';

const CAT_GRADIENTS: Record<number, string> = {
  1:  'linear-gradient(135deg, #0ea5e9, #1e40af)',
  2:  'linear-gradient(135deg, #1e293b, #334155)',
  3:  'linear-gradient(135deg, #06b6d4, #0e7490)',
  4:  'linear-gradient(135deg, #6366f1, #4338ca)',
  5:  'linear-gradient(135deg, #10b981, #047857)',
  6:  'linear-gradient(135deg, #f59e0b, #d97706)',
  7:  'linear-gradient(135deg, #f43f5e, #be123c)',
  8:  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  9:  'linear-gradient(135deg, #ec4899, #be185d)',
  10: 'linear-gradient(135deg, #475569, #1e293b)',
  11: 'linear-gradient(135deg, #22c55e, #15803d)',
  12: 'linear-gradient(135deg, #d946ef, #a21caf)'
};

@Component({
  selector: 'app-user-shop',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-shop.component.html',
  styleUrls: ['./user-shop.component.css']
})
export class UserShopComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cart = inject(CartService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  search = signal<string>('');
  categoryFilter = signal<number>(0);
  sortBy = signal<SortKey>('newest');
  buyingId = signal<number | null>(null);
  imageErrors = signal<Set<number>>(new Set());

  username = this.auth.username;
  phone = this.auth.phone;

  filtered = computed<Product[]>(() => {
    let list = this.products();
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q));
    if (this.categoryFilter()) list = list.filter(p => p.categoryId === this.categoryFilter());
    const s = this.sortBy();
    return list.slice().sort((a, b) => {
      if (s === 'priceAsc')  return a.price - b.price;
      if (s === 'priceDesc') return b.price - a.price;
      if (s === 'oldest')    return (a.createdAt || '').localeCompare(b.createdAt || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  });

  activeCategoryName = computed<string>(() => {
    if (!this.categoryFilter()) return 'All Products';
    return this.categories().find(c => c.id === this.categoryFilter())?.name || 'All Products';
  });

  activeCategoryDesc = computed<string>(() => {
    if (!this.categoryFilter()) return 'Browse our full electronics catalog';
    return this.categories().find(c => c.id === this.categoryFilter())?.description || '';
  });

  activeCategoryIcon = computed<string>(() => {
    if (!this.categoryFilter()) return 'bi-collection-fill';
    return this.categories().find(c => c.id === this.categoryFilter())?.icon || 'bi-tag';
  });

  ngOnInit(): void {
    this.api.listProducts().subscribe(ps => this.products.set(ps));
    this.api.listCategories().subscribe(cs => this.categories.set(cs));

    this.route.queryParamMap.subscribe(qp => {
      const cat = qp.get('cat');
      this.categoryFilter.set(cat ? +cat : 0);
    });
  }

  setSearch(v: string): void { this.search.set(v); }
  setSort(v: string): void { this.sortBy.set(v as SortKey); }

  catName(id: number): string {
    return this.categories().find(c => c.id === id)?.name || '—';
  }

  catIcon(id: number): string {
    return this.categories().find(c => c.id === id)?.icon || 'bi-tag';
  }

  catGradient(id: number): string {
    return CAT_GRADIENTS[id] || 'linear-gradient(135deg, #6366f1, #ec4899)';
  }

  stockClass(stock: number): string {
    if (stock > 10) return 'badge-green';
    if (stock > 0)  return 'badge-amber';
    return 'badge-rose';
  }

  markImageError(productId: number): void {
    const next = new Set(this.imageErrors());
    next.add(productId);
    this.imageErrors.set(next);
  }

  isImageBroken(productId?: number): boolean {
    return !!productId && this.imageErrors().has(productId);
  }

  discountPct(p: Product): number {
    if (!p.mrp || p.mrp <= p.price) return 0;
    return Math.round(((p.mrp - p.price) / p.mrp) * 100);
  }

  ratingStars(rating?: number): { full: number; half: boolean; empty: number } {
    const r = rating ?? 0;
    const full = Math.floor(r);
    const half = r - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return { full, half, empty: empty < 0 ? 0 : empty };
  }

  asArray(n: number): number[] {
    return Array.from({ length: Math.max(0, n) });
  }

  addToCart(p: Product): void {
    if (p.stock <= 0) {
      this.toast.warn('Product out of stock');
      return;
    }
    this.cart.add(p, 1);
    this.toast.success(`${p.name} added to cart`);
  }

  buyNow(p: Product): void {
    if (p.stock <= 0) {
      this.toast.warn('Product out of stock');
      return;
    }
    if (this.buyingId() !== null) return;
    this.buyingId.set(p.id!);

    const order: Order = {
      customer: this.username(),
      items: [{ productId: p.id!, qty: 1 }],
      amount: p.price,
      status: 'Pending',
      paymentMode: 'UPI'
    };

    this.api.createOrder(order).subscribe({
      next: created => {
        this.toast.success(`Order #${created.id} created — pay to confirm`);
        this.buyingId.set(null);
        this.router.navigate(['/user/checkout', created.id]);
      },
      error: () => {
        this.toast.error('Failed to place order');
        this.buyingId.set(null);
      }
    });
  }
}
