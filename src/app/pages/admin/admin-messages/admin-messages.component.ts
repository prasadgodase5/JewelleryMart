import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../../services/contact.service';
import { ContactMessage, ContactStatus } from '../../../models/contact-message.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-messages.component.html',
  styleUrl: './admin-messages.component.scss'
})
export class AdminMessagesComponent implements OnInit {
  private svc = inject(ContactService);

  loading = signal(true);
  error = signal<string | null>(null);
  messages = signal<ContactMessage[]>([]);
  filter = signal<'All' | ContactStatus>('All');
  expanded = signal<string | null>(null);

  filtered = computed<ContactMessage[]>(() => {
    const f = this.filter();
    return f === 'All' ? this.messages() : this.messages().filter(m => m.status === f);
  });

  stats = computed(() => {
    const list = this.messages();
    const sum = (s: ContactStatus) => list.filter(m => m.status === s).length;
    return { total: list.length, new: sum('New'), read: sum('Read'), replied: sum('Replied') };
  });

  ngOnInit(): void {
    this.svc.list()
      .pipe(catchError(e => { this.error.set(e?.message || 'Failed to load.'); return of([]); }))
      .subscribe(items => {
        this.messages.set(items);
        this.loading.set(false);
      });
  }

  setFilter(f: 'All' | ContactStatus) { this.filter.set(f); }

  toggle(m: ContactMessage): void {
    if (!m.id) return;
    const isOpen = this.expanded() === m.id;
    this.expanded.set(isOpen ? null : m.id);
    if (!isOpen && m.status === 'New') {
      this.svc.setStatus(m.id, 'Read').catch(() => {});
    }
  }

  fmtDate(ts: any): string {
    if (!ts) return '—';
    const d: Date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async setStatus(m: ContactMessage, status: ContactStatus): Promise<void> {
    if (!m.id) return;
    try { await this.svc.setStatus(m.id, status); }
    catch (e: any) { this.error.set(e?.message ?? 'Update failed.'); }
  }

  async remove(m: ContactMessage): Promise<void> {
    if (!m.id) return;
    if (!confirm('Delete this message? This cannot be undone.')) return;
    try { await this.svc.remove(m.id); }
    catch (e: any) { this.error.set(e?.message ?? 'Delete failed.'); }
  }
}
