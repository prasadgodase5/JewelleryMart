import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private count = 0;
  visible = signal(false);

  show() { this.count++; this.visible.set(true); }
  hide() {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this.visible.set(false);
  }
}
