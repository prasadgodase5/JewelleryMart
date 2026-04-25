import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { StorageService } from '../../../services/storage.service';
import { Product } from '../../../models/product.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss'
})
export class AdminProductsComponent implements OnInit {
  private svc = inject(ProductService);
  private storage = inject(StorageService);

  loading = signal(true);
  saving = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  products = signal<Product[]>([]);

  showForm = signal(false);
  editingId = signal<string | null>(null);

  form: Product = this.empty();
  pendingFiles: File[] = [];

  ngOnInit(): void {
    this.svc.list()
      .pipe(catchError(err => { this.error.set(err?.message || 'Failed to load.'); return of([]); }))
      .subscribe(items => {
        this.products.set(items);
        this.loading.set(false);
      });
  }

  empty(): Product {
    return {
      name: '', images: [], material: '', price: 0, size: '',
      description: '', category: '', featured: false, inStock: true
    };
  }

  newProduct(): void {
    this.form = this.empty();
    this.editingId.set(null);
    this.pendingFiles = [];
    this.showForm.set(true);
  }

  edit(p: Product): void {
    this.form = { ...p, images: [...p.images] };
    this.editingId.set(p.id ?? null);
    this.pendingFiles = [];
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.pendingFiles = [];
    this.error.set(null);
  }

  onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    this.pendingFiles = Array.from(input.files);
  }

  removeImage(url: string): void {
    this.form.images = this.form.images.filter(u => u !== url);
  }

  async save(form: NgForm): Promise<void> {
    if (form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      if (this.pendingFiles.length) {
        this.uploading.set(true);
        const newUrls = await this.storage.uploadMany(this.pendingFiles, this.editingId() ?? undefined);
        this.form.images = [...this.form.images, ...newUrls];
        this.pendingFiles = [];
        this.uploading.set(false);
      }

      if (this.form.images.length === 0) {
        this.error.set('Please add at least one image.');
        return;
      }

      const id = this.editingId();
      if (id) {
        const { id: _drop, ...patch } = this.form as any;
        await this.svc.update(id, patch);
      } else {
        await this.svc.create(this.form);
      }
      this.cancel();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to save product.');
    } finally {
      this.saving.set(false);
      this.uploading.set(false);
    }
  }

  async remove(p: Product): Promise<void> {
    if (!p.id) return;
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await this.svc.remove(p.id);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to delete.');
    }
  }

  toggleFeatured(p: Product): void {
    if (!p.id) return;
    this.svc.update(p.id, { featured: !p.featured });
  }
}
