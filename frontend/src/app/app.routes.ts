import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./pages/role-select/role-select.component').then(m => m.RoleSelectComponent)
  },
  {
    path: 'login/:role',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'admin' },
    children: [
      { path: '',          pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'products',  loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent) },
      { path: 'categories',loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'orders',    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent) },
      { path: 'users',     loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) },
      { path: 'checkout',     loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'checkout/:id', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) }
    ]
  },

  // User routes
  {
    path: 'user',
    canActivate: [authGuard],
    data: { role: 'user' },
    children: [
      { path: '',            pathMatch: 'full', redirectTo: 'shop' },
      { path: 'shop',        loadComponent: () => import('./pages/user-shop/user-shop.component').then(m => m.UserShopComponent) },
      { path: 'cart',        loadComponent: () => import('./pages/user-cart/user-cart.component').then(m => m.UserCartComponent) },
      { path: 'orders',      loadComponent: () => import('./pages/user-orders/user-orders.component').then(m => m.UserOrdersComponent) },
      { path: 'checkout',     loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'checkout/:id', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) }
    ]
  },

  { path: '**', redirectTo: '' }
];
