import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc,
  addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { ContactMessage, ContactStatus } from '../models/contact-message.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private fs = inject(Firestore);
  private col = collection(this.fs, 'contacts');

  list(): Observable<ContactMessage[]> {
    const q = query(this.col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as ContactMessage[])
    );
  }

  async create(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const payload = { ...msg, status: 'New' as ContactStatus, createdAt: serverTimestamp() };
    const ref = await addDoc(this.col, payload as any);
    return ref.id;
  }

  async setStatus(id: string, status: ContactStatus): Promise<void> {
    const ref = doc(this.fs, `contacts/${id}`);
    await updateDoc(ref, { status });
  }

  async remove(id: string): Promise<void> {
    const ref = doc(this.fs, `contacts/${id}`);
    await deleteDoc(ref);
  }
}
