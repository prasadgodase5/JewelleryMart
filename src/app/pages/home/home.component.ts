import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { InstagramSectionComponent } from '../../components/instagram-section/instagram-section.component';
import { DUMMY_PRODUCTS } from '../../data/dummy-products';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, InstagramSectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private productSvc = inject(ProductService);
  loading = signal(true);
  featured = signal<Product[]>([]);
  recent = signal<Product[]>([]);

  ngOnInit(): void {
    this.productSvc.list()
      .pipe(catchError(() => of(DUMMY_PRODUCTS)))
      .subscribe(items => {
        const list = items.length ? items : DUMMY_PRODUCTS;
        this.featured.set(list.filter(p => p.featured).slice(0, 4));
        this.recent.set(list.slice(0, 8));
        this.loading.set(false);
      });
  }
}
