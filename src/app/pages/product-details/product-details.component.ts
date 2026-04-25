import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ContactDialogService } from '../../services/contact-dialog.service';
import { Product } from '../../models/product.model';
import { toCartItem } from '../../models/cart-item.model';
import { DUMMY_PRODUCTS } from '../../data/dummy-products';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ProductService);
  private cart = inject(CartService);
  private contactDialog = inject(ContactDialogService);

  brand = environment.brand;
  loading = signal(true);
  product = signal<Product | undefined>(undefined);
  activeImg = signal(0);
  quantity = signal(1);
  added = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/products']); return; }

    if (id.startsWith('demo-')) {
      this.product.set(DUMMY_PRODUCTS.find(p => p.id === id));
      this.loading.set(false);
      return;
    }

    this.svc.get(id)
      .pipe(catchError(() => of(undefined)))
      .subscribe(p => {
        this.product.set(p ?? DUMMY_PRODUCTS.find(x => x.id === id));
        this.loading.set(false);
      });
  }

  setActive(i: number) { this.activeImg.set(i); }

  inc(): void { this.quantity.update(q => Math.min(q + 1, 99)); }
  dec(): void { this.quantity.update(q => Math.max(q - 1, 1)); }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cart.add(toCartItem(p, this.quantity()));
    this.added.set(true);
    setTimeout(() => this.added.set(false), 1800);
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/checkout']);
  }

  inquire(): void {
    const p = this.product();
    if (!p) return;
    this.contactDialog.show({
      productId: p.id,
      productName: p.name,
      subject: `Inquiry about ${p.name}`
    });
  }
}
