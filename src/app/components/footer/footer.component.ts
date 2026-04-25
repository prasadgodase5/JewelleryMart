import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ContactDialogService } from '../../services/contact-dialog.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  brand = environment.brand;
  year = new Date().getFullYear();
  private dialog = inject(ContactDialogService);

  openContact(): void { this.dialog.show(); }
}
