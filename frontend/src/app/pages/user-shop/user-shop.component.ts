import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { Product, Category, Order } from '../../models/models';

type SortKey = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';

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

  stockClass(stock: number): string {
    if (stock > 10) return 'badge-green';
    if (stock > 0)  return 'badge-amber';
    return 'badge-rose';
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
