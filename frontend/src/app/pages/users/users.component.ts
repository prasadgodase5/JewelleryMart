import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  list = signal<User[]>([]);
  search = signal<string>('');
  roleFilter = signal<'' | 'admin' | 'customer'>('');
  page = signal<number>(1);
  pageSize = 10;

  showModal = signal<boolean>(false);
  editing = signal<User | null>(null);
  submitted = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    name:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.pattern(/^\d{10}$/)]],
    role:  ['customer' as 'customer' | 'admin', [Validators.required]]
  });

  filtered = computed<User[]>(() => {
    let list = this.list();
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
    if (this.roleFilter()) list = list.filter(u => u.role === this.roleFilter());
    return list;
  });

  paged = computed<User[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.api.listUsers().subscribe(us => this.list.set(us));
  }

  setSearch(v: string)     { this.search.set(v); this.page.set(1); }
  setRoleFilter(v: string) { this.roleFilter.set(v as 'admin' | 'customer' | ''); this.page.set(1); }

  hasError(ctrlName: string, errKey?: string): boolean {
    const c = this.form.get(ctrlName);
    if (!c) return false;
    const touched = c.touched || c.dirty || this.submitted();
    if (!touched) return false;
    return errKey ? c.hasError(errKey) : c.invalid;
  }

  openCreate(): void {
    this.editing.set(null);
    this.submitted.set(false);
    this.form.reset({ name: '', email: '', phone: '', role: 'customer' });
    this.showModal.set(true);
  }

  openEdit(u: User): void {
    this.editing.set(u);
    this.submitted.set(false);
    this.form.reset({
      name: u.name, email: u.email, phone: u.phone || '', role: u.role
    });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Please fix the highlighted fields');
      return;
    }
    const payload = this.form.getRawValue() as User;
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

  async remove(u: User): Promise<void> {
    const ok = await this.confirm.ask(
      'Delete user',
      `Delete user "${u.name}"? This cannot be undone.`,
      'Delete'
    );
    if (!ok) return;
    this.api.deleteUser(u.id!).subscribe({
      next: () => { this.toast.success('User deleted'); this.refresh(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
