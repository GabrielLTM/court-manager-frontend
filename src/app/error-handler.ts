import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { AppState } from './app-state';
/** Keep rendering failures recoverable without exposing technical details to users. */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private injector = inject(Injector);
  handleError(error: unknown) {
    console.error(error);
    this.injector.get(AppState).fatalError.set('Tente recarregar a página ou volte para o início.');
  }
}
