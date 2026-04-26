import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { ToastContainerComponent } from './shared/toast/toast-container.component';
import { LoaderComponent } from './shared/loader/loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent, ToastContainerComponent, LoaderComponent],
  template: `
    <app-layout>
      <router-outlet></router-outlet>
    </app-layout>
    <app-toast-container></app-toast-container>
    <app-loader></app-loader>
  `
})
export class AppComponent {}
