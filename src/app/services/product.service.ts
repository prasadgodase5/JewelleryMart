import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, docData, addDoc,
  updateDoc, deleteDoc, query, orderBy, where, serverTimestamp, Timestamp
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private fs = inject(Firestore);
  private col = collection(this.fs, 'products');

  list(): Observable<Product[]> {
    const q = query(this.col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as Product[])
    );
  }

  featured(): Observable<Product[]> {
    const q = query(this.col, where('featured', '==', true));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as Product[])
    );
  }

  get(id: string): Observable<Product | undefined> {
    const ref = doc(this.fs, `products/${id}`);
    return docData(ref, { idField: 'id' }).pipe(
      map(d => d as Product | undefined)
    );
  }

  async create(product: Product): Promise<string> {
    const payload = {
      ...product,
      featured: product.featured ?? false,
      inStock: product.inStock ?? true,
      createdAt: serverTimestamp()
    };
    const ref = await addDoc(this.col, payload as any);
    return ref.id;
  }

  async update(id: string, patch: Partial<Product>): Promise<void> {
    const ref = doc(this.fs, `products/${id}`);
    await updateDoc(ref, patch as any);
  }

  async remove(id: string): Promise<void> {
    const ref = doc(this.fs, `products/${id}`);
    await deleteDoc(ref);
  }
}
