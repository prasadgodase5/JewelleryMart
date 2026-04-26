import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Product, Category } from '../../models/models';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PaginationComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-semibold text-slate-800">Products</h2>
        <button class="btn btn-primary" (click)="openCreate()">+ Add Product</button>
      </div>

      <div class="card">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input class="input" placeholder="Search by name…" [value]="search()" (input)="search.set($any($event.target).value); page.set(1)">
          <select class="input" [value]="categoryFilter()" (change)="categoryFilter.set(+$any($event.target).value); page.set(1)">
            <option [value]="0">All categories</option>
            <option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</option>
          </select>
          <select class="input" [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="priceAsc">Sort: Price ↑</option>
            <option value="priceDesc">Sort: Price ↓</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of paged()">
                <td><img [src]="p.image || 'https://via.placeholder.com/60'" class="w-12 h-12 object-cover rounded" alt=""></td>
                <td class="font-medium">{{ p.name }}</td>
                <td>{{ catName(p.categoryId) }}</td>
                <td>₹{{ p.price }}</td>
                <td>
                  <span class="badge" [ngClass]="p.stock > 10 ? 'bg-emerald-100 text-emerald-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'">
                    {{ p.stock }}
                  </span>
                </td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn btn-ghost text-sm" (click)="openEdit(p)">Edit</button>
                  <button class="btn btn-ghost text-sm text-red-600" (click)="remove(p)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="!paged().length"><td colspan="6" class="text-center text-slate-400 py-8">No products found</td></tr>
            </tbody>
          </table>
        </div>

        <app-pagination [total]="filtered().length" [page]="page()" [pageSize]="pageSize" (pageChange)="page.set($event)"></app-pagination>
      </div>
    </section>

    <app-modal [open]="showModal()" [title]="editing() ? 'Edit Product' : 'Add Product'" (close)="closeModal()">
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
        <div>
          <label class="label">Name *</label>
          <input class="input" formControlName="name" placeholder="e.g. Wireless Mouse">
          <p *ngIf="ctrlInvalid('name')" class="text-xs text-red-600 mt-1">Name is required</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Price *</label>
            <input class="input" type="number" min="0" formControlName="price">
            <p *ngIf="ctrlInvalid('price')" class="text-xs text-red-600 mt-1">Valid price required</p>
          </div>
          <div>
            <label class="label">Stock *</label>
            <input class="input" type="number" min="0" formControlName="stock">
          </div>
        </div>
        <div>
          <label class="label">Category *</label>
          <select class="input" formControlName="categoryId">
            <option [ngValue]="null">-- choose --</option>
            <option *ngFor="let c of categories()" [ngValue]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Image URL</label>
          <input class="input" formControlName="image" placeholder="https://…">
          <img *ngIf="form.value.image" [src]="form.value.image" class="mt-2 w-32 h-24 object-cover rounded border border-slate-200" alt="preview">
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ editing() ? 'Update' : 'Create' }}</button>
        </div>
      </form>
    </app-modal>
  `
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  search = signal('');
  categoryFilter = signal(0);
  sortBy = signal<'newest' | 'oldest' | 'priceAsc' | 'priceDesc'>('newest');
  page = signal(1);
  pageSize = 8;

  showModal = signal(false);
  editing = signal<Product | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [null as number | null, [Validators.required]],
    image: ['']
  });

  filtered = computed(() => {
    let list = this.products();
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q));
    if (this.categoryFilter()) list = list.filter(p => p.categoryId === this.categoryFilter());
    const s = this.sortBy();
    list = list.slice().sort((a, b) => {
      if (s === 'priceAsc') return a.price - b.price;
      if (s === 'priceDesc') return b.price - a.price;
      if (s === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return list;
  });

  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit() {
    this.refresh();
    this.api.listCategories().subscribe(cs => this.categories.set(cs));
  }

  refresh() {
    this.api.listProducts().subscribe(ps => this.products.set(ps));
  }

  catName(id: number) {
    return this.categories().find(c => c.id === id)?.name || '—';
  }

  openCreate() {
    this.editing.set(null);
    this.form.reset({ name: '', price: 0, stock: 0, categoryId: null, image: '' });
    this.showModal.set(true);
  }

  openEdit(p: Product) {
    this.editing.set(p);
    this.form.reset({ name: p.name, price: p.price, stock: p.stock, categoryId: p.categoryId, image: p.image || '' });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  ctrlInvalid(name: string) {
    const c = this.form.get(name);
    return c && c.touched && c.invalid;
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = this.form.value as Product;
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

  async remove(p: Product) {
    const ok = await this.confirm.ask('Delete product', `Are you sure you want to delete "${p.name}"?`, 'Delete');
    if (!ok) return;
    this.api.deleteProduct(p.id!).subscribe({
      next: () => { this.toast.success('Deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
