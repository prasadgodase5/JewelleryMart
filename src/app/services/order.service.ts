import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc,
  addDoc, updateDoc, query, orderBy, serverTimestamp
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Order, PaymentStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private fs = inject(Firestore);
  private col = collection(this.fs, 'orders');

  list(): Observable<Order[]> {
    const q = query(this.col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as Order[])
    );
  }

  async create(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const payload = { ...order, createdAt: serverTimestamp() };
    const ref = await addDoc(this.col, payload as any);
    return ref.id;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<void> {
    const ref = doc(this.fs, `orders/${id}`);
    await updateDoc(ref, { paymentStatus: status });
  }
}
