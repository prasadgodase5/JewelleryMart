import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Category } from '../../models/models';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PaginationComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  list = signal<Category[]>([]);
  search = signal<string>('');
  page = signal<number>(1);
  pageSize = 10;

  showModal = signal<boolean>(false);
  editing = signal<Category | null>(null);
  submitted = signal<boolean>(false);

  iconOptions: { value: string; label: string }[] = [
    { value: 'bi-tag',                label: 'Tag' },
    { value: 'bi-snow2',              label: 'AC / Cooling' },
    { value: 'bi-tv',                 label: 'TV / Display' },
    { value: 'bi-archive',            label: 'Refrigerator' },
    { value: 'bi-droplet',            label: 'Washing' },
    { value: 'bi-fan',                label: 'Fan' },
    { value: 'bi-lightbulb',          label: 'Lighting' },
    { value: 'bi-cup-hot',            label: 'Kitchen' },
    { value: 'bi-speaker',            label: 'Audio' },
    { value: 'bi-phone',              label: 'Mobile' },
    { value: 'bi-laptop',             label: 'Laptop / PC' },
    { value: 'bi-camera',             label: 'Camera' },
    { value: 'bi-scissors',           label: 'Personal Care' },
    { value: 'bi-controller',         label: 'Gaming' },
    { value: 'bi-watch',              label: 'Wearables' },
    { value: 'bi-headphones',         label: 'Headphones' }
  ];

  form: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    description: ['', [Validators.maxLength(200)]],
    icon:        ['bi-tag']
  });

  filtered = computed<Category[]>(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.list();
    return this.list().filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  });

  paged = computed<Category[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.api.listCategories().subscribe(cs => this.list.set(cs));
  }

  hasError(ctrlName: string, errKey?: string): boolean {
    const c = this.form.get(ctrlName);
    if (!c) return false;
    const touched = c.touched || c.dirty || this.submitted();
    if (!touched) return false;
    return errKey ? c.hasError(errKey) : c.invalid;
  }

  setSearch(v: string) { this.search.set(v); this.page.set(1); }

  openCreate(): void {
    this.editing.set(null);
    this.submitted.set(false);
    this.form.reset({ name: '', description: '', icon: 'bi-tag' });
    this.showModal.set(true);
  }

  openEdit(c: Category): void {
    this.editing.set(c);
    this.submitted.set(false);
    this.form.reset({ name: c.name, description: c.description || '', icon: c.icon || 'bi-tag' });
    this.showModal.set(true);
  }

  selectedIcon(): string {
    return this.form.get('icon')?.value || 'bi-tag';
  }

  closeModal(): void { this.showModal.set(false); }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Please fix the highlighted fields');
      return;
    }
    const payload = this.form.getRawValue() as Category;
    if (this.editing()) {
      this.api.updateCategory(this.editing()!.id!, payload).subscribe({
        next: () => { this.toast.success('Category updated'); this.closeModal(); this.refresh(); },
        error: () => this.toast.error('Update failed')
      });
    } else {
      this.api.createCategory(payload).subscribe({
        next: () => { this.toast.success('Category created'); this.closeModal(); this.refresh(); },
        error: () => this.toast.error('Create failed')
      });
    }
  }

  async remove(c: Category): Promise<void> {
    const ok = await this.confirm.ask(
      'Delete category',
      `Delete category "${c.name}"? Products linked to it will lose this label.`,
      'Delete'
    );
    if (!ok) return;
    this.api.deleteCategory(c.id!).subscribe({
      next: () => { this.toast.success('Category deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
