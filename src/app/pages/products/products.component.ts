import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { DUMMY_PRODUCTS } from '../../data/dummy-products';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  private svc = inject(ProductService);

  loading = signal(true);
  all = signal<Product[]>([]);
  search = signal('');
  category = signal<string>('All');
  sort = signal<'new' | 'price-asc' | 'price-desc'>('new');

  categories = computed<string[]>(() => {
    const cats = new Set<string>();
    this.all().forEach(p => p.category && cats.add(p.category));
    return ['All', ...Array.from(cats).sort()];
  });

  filtered = computed<Product[]>(() => {
    const term = this.search().trim().toLowerCase();
    const cat = this.category();
    let out = this.all().filter(p => {
      if (cat !== 'All' && p.category !== cat) return false;
      if (term && !(`${p.name} ${p.material} ${p.description}`.toLowerCase().includes(term))) return false;
      return true;
    });
    switch (this.sort()) {
      case 'price-asc':  out = [...out].sort((a, b) => a.price - b.price); break;
      case 'price-desc': out = [...out].sort((a, b) => b.price - a.price); break;
    }
    return out;
  });

  ngOnInit(): void {
    this.svc.list()
      .pipe(catchError(() => of(DUMMY_PRODUCTS)))
      .subscribe(items => {
        this.all.set(items.length ? items : DUMMY_PRODUCTS);
        this.loading.set(false);
      });
  }

  setCategory(c: string) { this.category.set(c); }
  setSort(s: 'new' | 'price-asc' | 'price-desc') { this.sort.set(s); }
}
