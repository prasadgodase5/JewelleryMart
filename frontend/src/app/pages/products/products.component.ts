import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Product, Category } from '../../models/models';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

type SortKey = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PaginationComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  search = signal<string>('');
  categoryFilter = signal<number>(0);
  sortBy = signal<SortKey>('newest');
  page = signal<number>(1);
  pageSize = 8;

  showModal = signal<boolean>(false);
  editing = signal<Product | null>(null);
  submitted = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    name:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    price:      [0,  [Validators.required, Validators.min(1), Validators.max(1_000_000)]],
    stock:      [0,  [Validators.required, Validators.min(0), Validators.max(100_000)]],
    categoryId: [null as number | null, [Validators.required]],
    image:      ['', [Validators.pattern(/^(https?:\/\/.+)?$/i)]]
  });

  filtered = computed<Product[]>(() => {
    let list = this.products();
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q));
    if (this.categoryFilter()) list = list.filter(p => p.categoryId === this.categoryFilter());
    const s = this.sortBy();
    list = list.slice().sort((a, b) => {
      if (s === 'priceAsc')  return a.price - b.price;
      if (s === 'priceDesc') return b.price - a.price;
      if (s === 'oldest')    return (a.createdAt || '').localeCompare(b.createdAt || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return list;
  });

  paged = computed<Product[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  // ---- Lifecycle ----
  ngOnInit(): void {
    this.refresh();
    this.api.listCategories().subscribe(cs => this.categories.set(cs));
  }

  refresh(): void {
    this.api.listProducts().subscribe(ps => this.products.set(ps));
  }

  // ---- Helpers ----
  catName(id: number): string {
    return this.categories().find(c => c.id === id)?.name || '—';
  }

  stockClass(stock: number): string {
    if (stock > 10) return 'badge-green';
    if (stock > 0)  return 'badge-amber';
    return 'badge-rose';
  }

  hasError(ctrlName: string, errKey?: string): boolean {
    const c = this.form.get(ctrlName);
    if (!c) return false;
    const touched = c.touched || c.dirty || this.submitted();
    if (!touched) return false;
    return errKey ? c.hasError(errKey) : c.invalid;
  }

  // ---- Filters ----
  setSearch(v: string)         { this.search.set(v); this.page.set(1); }
  setCategoryFilter(v: string) { this.categoryFilter.set(+v); this.page.set(1); }
  setSort(v: string)           { this.sortBy.set(v as SortKey); }

  // ---- Modal ----
  openCreate(): void {
    this.editing.set(null);
    this.submitted.set(false);
    this.form.reset({ name: '', price: 0, stock: 0, categoryId: null, image: '' });
    this.showModal.set(true);
  }

  openEdit(p: Product): void {
    this.editing.set(p);
    this.submitted.set(false);
    this.form.reset({
      name: p.name, price: p.price, stock: p.stock,
      categoryId: p.categoryId, image: p.image || ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Please fix the highlighted fields');
      return;
    }
    const payload = this.form.getRawValue() as Product;
    if (this.editing()) {
      this.api.updateProduct(this.editing()!.id!, payload).subscribe({
        next: () => { this.toast.success('Product updated'); this.closeModal(); this.refresh(); },
        error: () => this.toast.error('Update failed')
      });
    } else {
      this.api.createProduct(payload).subscribe({
        next: () => { this.toast.success('Product created'); this.closeModal(); this.refresh(); },
        error: () => this.toast.error('Create failed')
      });
    }
  }

  async remove(p: Product): Promise<void> {
    const ok = await this.confirm.ask(
      'Delete product',
      `Are you sure you want to delete "${p.name}"? This cannot be undone.`,
      'Delete'
    );
    if (!ok) return;
    this.api.deleteProduct(p.id!).subscribe({
      next: () => { this.toast.success('Product deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
