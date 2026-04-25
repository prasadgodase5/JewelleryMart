export interface Product {
  id?: string;
  name: string;
  images: string[];
  material: string;
  price: number;
  size: string;
  description: string;
  category?: string;
  featured?: boolean;
  inStock?: boolean;
  createdAt?: any; // Firestore Timestamp | Date
}
