import { ErrorHandler } from '@angular/core';
import { AppErrorHandler } from './presentation/angular/error-handler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AppComponent } from './presentation/angular/app.component';
import { routes } from './presentation/angular/routes';
import { APP_SERVICES } from './presentation/angular/state';
import { createContainer } from './di/container';
bootstrapApplication(AppComponent, {
  providers: [
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideRouter(routes, withComponentInputBinding()),
    { provide: APP_SERVICES, useFactory: createContainer },
  ],
}).catch(console.error);
