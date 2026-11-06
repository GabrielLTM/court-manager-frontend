import { ErrorHandler } from '@angular/core';
import { AppErrorHandler } from './app/error-handler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import { APP_SERVICES } from './app/app-state';
import { createContainer } from './core/di/container';
bootstrapApplication(AppComponent, {
  providers: [
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideRouter(routes, withComponentInputBinding()),
    { provide: APP_SERVICES, useFactory: createContainer },
  ],
}).catch(console.error);
