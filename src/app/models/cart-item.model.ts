import { Product } from './product.model';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  material: string;
  quantity: number;
}

export function toCartItem(p: Product, quantity: number = 1): CartItem {
  return {
    productId: p.id ?? '',
    name: p.name,
    image: p.images?.[0] ?? '',
    price: p.price,
    material: p.material,
    quantity
  };
}
