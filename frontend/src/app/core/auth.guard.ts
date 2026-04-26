import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = (route.data?.['role'] as UserRole | undefined) ?? null;

  if (!auth.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  if (required && auth.role() !== required) {
    router.navigate([auth.defaultLanding()]);
    return false;
  }

  return true;
};

export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    router.navigate([auth.defaultLanding()]);
    return false;
  }
  return true;
};
