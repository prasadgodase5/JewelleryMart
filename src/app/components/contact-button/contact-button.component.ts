import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactDialogService } from '../../services/contact-dialog.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-button.component.html',
  styleUrl: './contact-button.component.scss'
})
export class ContactButtonComponent {
  private dialog = inject(ContactDialogService);

  brand = environment.brand;
  expanded = signal(false);

  toggle(): void { this.expanded.update(v => !v); }
  close(): void { this.expanded.set(false); }

  openInstagram(): void {
    window.open(this.brand.instagram, '_blank', 'noopener');
    this.close();
  }

  openMessage(): void {
    this.dialog.show();
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.close(); }
}
