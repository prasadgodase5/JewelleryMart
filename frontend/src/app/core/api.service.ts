import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, Category, Order, User, Stats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  // Products
  listProducts(): Observable<Product[]> { return this.http.get<Product[]>(`${this.base}/products`); }
  createProduct(p: Product) { return this.http.post<Product>(`${this.base}/products`, p); }
  updateProduct(id: number, p: Product) { return this.http.put<Product>(`${this.base}/products/${id}`, p); }
  deleteProduct(id: number) { return this.http.delete<Product>(`${this.base}/products/${id}`); }

  // Categories
  listCategories(): Observable<Category[]> { return this.http.get<Category[]>(`${this.base}/categories`); }
  createCategory(c: Category) { return this.http.post<Category>(`${this.base}/categories`, c); }
  updateCategory(id: number, c: Category) { return this.http.put<Category>(`${this.base}/categories/${id}`, c); }
  deleteCategory(id: number) { return this.http.delete<Category>(`${this.base}/categories/${id}`); }

  // Orders
  listOrders(): Observable<Order[]> { return this.http.get<Order[]>(`${this.base}/orders`); }
  createOrder(o: Order) { return this.http.post<Order>(`${this.base}/orders`, o); }
  updateOrder(id: number, o: Partial<Order>) { return this.http.put<Order>(`${this.base}/orders/${id}`, o); }
  deleteOrder(id: number) { return this.http.delete<Order>(`${this.base}/orders/${id}`); }
  getOrder(id: number) { return this.http.get<Order>(`${this.base}/orders/${id}`); }

  // Users
  listUsers(): Observable<User[]> { return this.http.get<User[]>(`${this.base}/users`); }
  createUser(u: User) { return this.http.post<User>(`${this.base}/users`, u); }
  updateUser(id: number, u: Partial<User>) { return this.http.put<User>(`${this.base}/users/${id}`, u); }
  deleteUser(id: number) { return this.http.delete<User>(`${this.base}/users/${id}`); }

  // Auth
  login(username: string, password: string, role: 'admin' | 'customer') {
    return this.http.post<User>(`${this.base}/auth/login`, { username, password, role });
  }

  // Payment - simulated
  expirePayment(orderId: number) { return this.http.post<Order>(`${this.base}/expire-payment`, { orderId }); }

  // Payment - Razorpay (real UPI)
  paymentConfig() {
    return this.http.get<{ enabled: boolean; keyId: string | null; provider: string | null }>(`${this.base}/payments/config`);
  }
  createPaymentOrder(orderId: number) {
    return this.http.post<{
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      localOrderId: number;
      customer: string;
    }>(`${this.base}/payments/create-order`, { orderId });
  }
  verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    localOrderId: number;
  }) {
    return this.http.post<Order>(`${this.base}/payments/verify`, payload);
  }
  manualConfirmPayment(orderId: number) {
    return this.http.post<Order>(`${this.base}/payments/manual-confirm`, { orderId });
  }

  // Stats
  stats(): Observable<Stats> { return this.http.get<Stats>(`${this.base}/stats`); }
}
