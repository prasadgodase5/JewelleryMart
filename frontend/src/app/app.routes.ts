import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'products', loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent) },
  { path: 'categories', loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'orders', loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent) },
  { path: 'users', loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) },
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'checkout/:id', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
