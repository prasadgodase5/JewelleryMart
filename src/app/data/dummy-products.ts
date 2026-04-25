import { Product } from '../models/product.model';

// Sample products used as fallback when Firestore has no data yet.
// Images use Unsplash CDN — replace with your own once seeded.
export const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'Royal Gold Necklace',
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80'
    ],
    material: '22K Gold',
    price: 45000,
    size: 'Length 18 inch',
    description: 'A timeless 22K gold necklace handcrafted by master artisans, perfect for weddings and special occasions.',
    category: 'Necklace',
    featured: true,
    inStock: true
  },
  {
    id: 'demo-2',
    name: 'Diamond Stud Earrings',
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
    ],
    material: '18K Gold + Diamond',
    price: 28500,
    size: '6mm',
    description: 'Brilliant-cut diamond studs set in 18K gold. Elegant everyday wear with timeless sparkle.',
    category: 'Earrings',
    featured: true,
    inStock: true
  },
  {
    id: 'demo-3',
    name: 'Silver Charm Bracelet',
    images: [
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=800&q=80'
    ],
    material: '925 Sterling Silver',
    price: 4999,
    size: 'Adjustable 6.5–8 inch',
    description: 'Sterling silver charm bracelet featuring intricate detailing — a graceful gift for every occasion.',
    category: 'Bracelet',
    featured: false,
    inStock: true
  },
  {
    id: 'demo-4',
    name: 'Traditional Bridal Bangles (Pair)',
    images: [
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
    ],
    material: '22K Gold',
    price: 78000,
    size: '2.6 / 2.8',
    description: 'Hand-carved traditional bridal bangles in 22K gold. Sold as a matched pair.',
    category: 'Bangles',
    featured: true,
    inStock: true
  },
  {
    id: 'demo-5',
    name: 'Solitaire Engagement Ring',
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
    ],
    material: '18K White Gold + Diamond',
    price: 65000,
    size: 'Sizes 5–9',
    description: 'A classic solitaire setting featuring a brilliant-cut diamond on an 18K white gold band.',
    category: 'Ring',
    featured: true,
    inStock: true
  },
  {
    id: 'demo-6',
    name: 'Pearl Drop Pendant',
    images: [
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80'
    ],
    material: '18K Gold + Freshwater Pearl',
    price: 12500,
    size: 'Pendant 2.4 cm',
    description: 'Lustrous freshwater pearl set in delicate 18K gold — minimalist elegance for everyday wear.',
    category: 'Pendant',
    featured: false,
    inStock: true
  },
  {
    id: 'demo-7',
    name: 'Antique Temple Jhumka',
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80'
    ],
    material: 'Gold Plated Brass',
    price: 3499,
    size: 'Drop 5 cm',
    description: 'Hand-finished temple-style jhumka with antique gold plating — perfect for festive looks.',
    category: 'Earrings',
    featured: false,
    inStock: true
  },
  {
    id: 'demo-8',
    name: 'Kundan Choker Set',
    images: [
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80'
    ],
    material: 'Kundan + Gold Plated',
    price: 18999,
    size: 'Necklace + Earrings',
    description: 'Statement kundan choker set with matched earrings — designed for the modern bride.',
    category: 'Set',
    featured: true,
    inStock: true
  }
];
