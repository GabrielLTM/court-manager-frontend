import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppState } from './app-state';
@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  readonly state = inject(AppState);
}
