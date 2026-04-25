import { CartItem } from './cart-item.model';

export type PaymentStatus = 'Pending' | 'Paid' | 'Completed' | 'Cancelled';

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
}

export interface Order {
  id?: string;
  products: CartItem[];
  totalAmount: number;
  userDetails: CustomerDetails;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'UPI';
  createdAt?: any;
}
