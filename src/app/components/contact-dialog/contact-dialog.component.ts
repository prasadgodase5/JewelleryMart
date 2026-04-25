import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContactDialogService } from '../../services/contact-dialog.service';
import { ContactService } from '../../services/contact.service';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss'
})
export class ContactDialogComponent {
  private dialog = inject(ContactDialogService);
  private contact = inject(ContactService);

  open = this.dialog.open;
  prefill = this.dialog.prefill;

  form: ContactForm = this.empty();
  submitting = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const p = this.prefill();
      if (isOpen) {
        this.form = { ...this.empty(), subject: p.subject ?? '' };
        this.success.set(false);
        this.error.set(null);
      }
    });
  }

  private empty(): ContactForm {
    return { name: '', email: '', phone: '', subject: '', message: '' };
  }

  close(): void {
    this.dialog.close();
    setTimeout(() => {
      this.form = this.empty();
      this.success.set(false);
      this.error.set(null);
    }, 250);
  }

  async submit(f: NgForm): Promise<void> {
    if (f.invalid || this.submitting()) {
      Object.values(f.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      const payload: Record<string, any> = {
        name: this.form.name.trim(),
        message: this.form.message.trim()
      };
      const email = this.form.email.trim();
      const phone = this.form.phone.trim();
      const subject = this.form.subject.trim();
      if (email)   payload['email']   = email;
      if (phone)   payload['phone']   = phone;
      if (subject) payload['subject'] = subject;

      const p = this.prefill();
      if (p.productId)   payload['productId']   = p.productId;
      if (p.productName) payload['productName'] = p.productName;

      await this.contact.create(payload as any);
      this.success.set(true);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Could not send message. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
