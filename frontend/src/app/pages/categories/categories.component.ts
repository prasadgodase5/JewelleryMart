import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-semibold text-slate-800">Categories</h2>
        <button class="btn btn-primary" (click)="openCreate()">+ Add Category</button>
      </div>

      <div class="card">
        <input class="input mb-3 max-w-sm" placeholder="Search categories…" [value]="search()" (input)="search.set($any($event.target).value); page.set(1)">

        <div class="overflow-x-auto">
          <table>
            <thead><tr><th>Name</th><th>Description</th><th class="text-right">Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of paged()">
                <td class="font-medium">{{ c.name }}</td>
                <td class="text-slate-600">{{ c.description || '—' }}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn btn-ghost text-sm" (click)="openEdit(c)">Edit</button>
                  <button class="btn btn-ghost text-sm text-red-600" (click)="remove(c)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="!paged().length"><td colspan="3" class="text-center text-slate-400 py-8">No categories</td></tr>
            </tbody>
          </table>
        </div>

        <app-pagination [total]="filtered().length" [page]="page()" [pageSize]="pageSize" (pageChange)="page.set($event)"></app-pagination>
      </div>
    </section>

    <app-modal [open]="showModal()" [title]="editing() ? 'Edit Category' : 'Add Category'" (close)="closeModal()">
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
        <div>
          <label class="label">Name *</label>
          <input class="input" formControlName="name">
          <p *ngIf="ctrlInvalid('name')" class="text-xs text-red-600 mt-1">Name is required</p>
        </div>
        <div>
          <label class="label">Description</label>
          <textarea class="input" rows="3" formControlName="description"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ editing() ? 'Update' : 'Create' }}</button>
        </div>
      </form>
    </app-modal>
  `
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  list = signal<Category[]>([]);
  search = signal('');
  page = signal(1);
  pageSize = 10;

  showModal = signal(false);
  editing = signal<Category | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['']
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.list();
    return this.list().filter(c => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  });

  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit() { this.refresh(); }

  refresh() { this.api.listCategories().subscribe(cs => this.list.set(cs)); }

  openCreate() { this.editing.set(null); this.form.reset({ name: '', description: '' }); this.showModal.set(true); }
  openEdit(c: Category) { this.editing.set(c); this.form.reset({ name: c.name, description: c.description || '' }); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  ctrlInvalid(name: string) {
    const c = this.form.get(name);
    return c && c.touched && c.invalid;
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = this.form.value as Category;
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

  async remove(c: Category) {
    const ok = await this.confirm.ask('Delete category', `Delete category "${c.name}"?`, 'Delete');
    if (!ok) return;
    this.api.deleteCategory(c.id!).subscribe({
      next: () => { this.toast.success('Deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
