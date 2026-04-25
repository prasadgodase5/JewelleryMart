export type ContactStatus = 'New' | 'Read' | 'Replied' | 'Archived';

export interface ContactMessage {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  productId?: string;
  productName?: string;
  status: ContactStatus;
  createdAt?: any;
}
