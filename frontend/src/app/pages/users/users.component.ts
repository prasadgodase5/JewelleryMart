import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { User } from '../../models/models';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PaginationComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-semibold text-slate-800">Users</h2>
        <button class="btn btn-primary" (click)="openCreate()">+ Add User</button>
      </div>

      <div class="card">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input class="input" placeholder="Search name or email…" [value]="search()" (input)="search.set($any($event.target).value); page.set(1)">
          <select class="input" [value]="roleFilter()" (change)="roleFilter.set($any($event.target).value); page.set(1)">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th class="text-right">Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let u of paged()">
                <td class="font-medium">{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.phone || '—' }}</td>
                <td>
                  <span class="badge" [ngClass]="u.role==='admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'">{{ u.role }}</span>
                </td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn btn-ghost text-sm" (click)="openEdit(u)">Edit</button>
                  <button class="btn btn-ghost text-sm text-red-600" (click)="remove(u)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="!paged().length"><td colspan="5" class="text-center text-slate-400 py-8">No users</td></tr>
            </tbody>
          </table>
        </div>

        <app-pagination [total]="filtered().length" [page]="page()" [pageSize]="pageSize" (pageChange)="page.set($event)"></app-pagination>
      </div>
    </section>

    <app-modal [open]="showModal()" [title]="editing() ? 'Edit User' : 'Add User'" (close)="closeModal()">
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
        <div>
          <label class="label">Name *</label>
          <input class="input" formControlName="name">
          <p *ngIf="ctrlInvalid('name')" class="text-xs text-red-600 mt-1">Name required</p>
        </div>
        <div>
          <label class="label">Email *</label>
          <input class="input" type="email" formControlName="email">
          <p *ngIf="ctrlInvalid('email')" class="text-xs text-red-600 mt-1">Valid email required</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Phone</label>
            <input class="input" formControlName="phone">
          </div>
          <div>
            <label class="label">Role *</label>
            <select class="input" formControlName="role">
              <option value="customer">customer</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ editing() ? 'Update' : 'Create' }}</button>
        </div>
      </form>
    </app-modal>
  `
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  list = signal<User[]>([]);
  search = signal('');
  roleFilter = signal<'' | 'admin' | 'customer'>('');
  page = signal(1);
  pageSize = 10;

  showModal = signal(false);
  editing = signal<User | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['customer' as 'customer' | 'admin', [Validators.required]]
  });

  filtered = computed(() => {
    let list = this.list();
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    if (this.roleFilter()) list = list.filter(u => u.role === this.roleFilter());
    return list;
  });

  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit() { this.refresh(); }

  refresh() { this.api.listUsers().subscribe(us => this.list.set(us)); }

  openCreate() { this.editing.set(null); this.form.reset({ name: '', email: '', phone: '', role: 'customer' }); this.showModal.set(true); }
  openEdit(u: User) { this.editing.set(u); this.form.reset({ name: u.name, email: u.email, phone: u.phone || '', role: u.role }); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  ctrlInvalid(name: string) {
    const c = this.form.get(name);
    return c && c.touched && c.invalid;
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = this.form.value as User;
    if (this.editing()) {
      this.api.updateUser(this.editing()!.id!, payload).subscribe({
        next: () => { this.toast.success('User updated'); this.closeModal(); this.refresh(); },
        error: () => this.toast.error('Update failed')
      });
    } else {
      this.api.createUser(payload).subscribe({
        next: () => { this.toast.success('User created'); this.closeModal(); this.refresh(); },
        error: () => this.toast.error('Create failed')
      });
    }
  }

  async remove(u: User) {
    const ok = await this.confirm.ask('Delete user', `Delete user "${u.name}"?`, 'Delete');
    if (!ok) return;
    this.api.deleteUser(u.id!).subscribe({
      next: () => { this.toast.success('Deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
