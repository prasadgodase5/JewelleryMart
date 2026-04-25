import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  brand = environment.brand;
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit(form: NgForm): Promise<void> {
    if (form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/admin']);
    } catch (e: any) {
      const code = e?.code ?? '';
      this.error.set(this.friendlyError(code, e?.message));
    } finally {
      this.loading.set(false);
    }
  }

  private friendlyError(code: string, fallback?: string): string {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.';
      default:
        return fallback ?? 'Login failed. Please try again.';
    }
  }
}
