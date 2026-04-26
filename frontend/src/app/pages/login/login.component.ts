import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UserRole } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  role = signal<UserRole>('user');
  showPassword = signal<boolean>(false);
  submitted = signal<boolean>(false);
  errorMsg = signal<string>('');

  form: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(40)]]
  });

  ngOnInit(): void {
    const r = this.route.snapshot.paramMap.get('role');
    this.role.set(r === 'admin' ? 'admin' : 'user');
  }

  hasError(ctrlName: string, errKey?: string): boolean {
    const c = this.form.get(ctrlName);
    if (!c) return false;
    const touched = c.touched || c.dirty || this.submitted();
    if (!touched) return false;
    return errKey ? c.hasError(errKey) : c.invalid;
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  submit(): void {
    this.submitted.set(true);
    this.errorMsg.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.value;
    const ok = this.auth.login(username!, password!, this.role());
    if (ok) {
      this.toast.success(`Welcome, ${this.auth.username()}!`);
      this.router.navigate([this.auth.defaultLanding()]);
    } else {
      this.errorMsg.set('Invalid credentials. Use prasad / 9604 to sign in.');
      this.toast.error('Invalid credentials');
    }
  }

  roleLabel(): string {
    return this.role() === 'admin' ? 'Admin' : 'User';
  }
}
