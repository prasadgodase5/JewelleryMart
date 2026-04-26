export interface Product {
  id?: number;
  name: string;
  price: number;
  categoryId: number;
  stock: number;
  image?: string;
  createdAt?: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
}

export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Paid' | 'Expired';

export interface OrderItem {
  productId: number;
  qty: number;
}

export interface Order {
  id?: number;
  customer: string;
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  paymentMode?: string;
  createdAt?: string;
  paidAt?: string;
  paymentId?: string;
  razorpayOrderId?: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
}

export interface Stats {
  products: number;
  categories: number;
  orders: number;
  users: number;
  revenue: number;
}
