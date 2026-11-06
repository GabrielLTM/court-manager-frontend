import { Component, Input, output } from '@angular/core';
@Component({
  selector: 'arena-pagination',
  standalone: true,
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() total = 0;
  @Input() size = 8;
  changed = output<number>();
  get count() {
    return Math.max(1, Math.ceil(this.total / this.size));
  }
}
