import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppState } from './state';
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<section class="card">
    <p class="kicker">404</p>
    <h1>Página não encontrada</h1>
    <p>Confira o endereço ou volte para o início.</p>
    <a class="btn" [routerLink]="state.home()">Voltar ao início</a>
  </section>`,
})
export class NotFoundComponent {
  readonly state = inject(AppState);
}
