import { Injectable, inject } from '@angular/core';
import {
  Storage, ref, uploadBytes, getDownloadURL, deleteObject
} from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  async uploadProductImage(file: File, productId?: string): Promise<string> {
    const folder = productId ? `products/${productId}` : 'products/_temp';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}-${safeName}`;
    const r = ref(this.storage, path);
    await uploadBytes(r, file, { contentType: file.type });
    return getDownloadURL(r);
  }

  async uploadMany(files: File[], productId?: string): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      urls.push(await this.uploadProductImage(file, productId));
    }
    return urls;
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const r = ref(this.storage, url);
      await deleteObject(r);
    } catch (e) {
      console.warn('Failed to delete image', url, e);
    }
  }
}
