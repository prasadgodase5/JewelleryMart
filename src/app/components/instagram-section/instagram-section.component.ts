import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-instagram-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instagram-section.component.html',
  styleUrl: './instagram-section.component.scss'
})
export class InstagramSectionComponent {
  brand = environment.brand;

  highlights = [
    { name: 'Order',     emoji: '🛍️' },
    { name: 'Feedback',  emoji: '💛' },
    { name: 'Necklace',  emoji: '📿' },
    { name: 'Photo',     emoji: '📸' },
    { name: 'Earrings',  emoji: '✨' },
    { name: 'Video',     emoji: '🎬' },
    { name: 'Design',    emoji: '🎨' }
  ];
}
