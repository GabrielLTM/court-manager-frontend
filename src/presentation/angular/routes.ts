import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Routes, Router } from '@angular/router';
import { AppState } from './state';
import { Perfil } from '@/domain/enums';
export const authenticated: CanActivateFn = (route, url) => {
  const state = inject(AppState);
  const router = inject(Router);
  const session = state.services.auth.sessaoAtual();
  if (!session) return router.createUrlTree(['/login'], { queryParams: { from: url.url } });
  if (route.data['role'] && route.data['role'] !== session.usuario.perfil)
    return router.parseUrl(state.home());
  return true;
};
export const publicOnly: CanActivateFn = () => {
  const state = inject(AppState);
  return state.services.auth.sessaoAtual() ? inject(Router).parseUrl(state.home()) : true;
};
const unsaved: CanDeactivateFn<{ canLeave?: () => boolean | Promise<boolean> }> = (
  component,
  route,
) => {
  const state = inject(AppState);
  const session = state.services.auth.sessaoAtual();
  if (!session && route.data['role']) return true;
  if (route.data['role'] && route.data['role'] !== session?.usuario.perfil) return true;
  return component.canLeave?.() ?? true;
};
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [() => inject(Router).parseUrl(inject(AppState).home())],
    children: [],
  },
  ...['login', 'cadastro'].map((path) => ({
    path,
    title: path === 'login' ? 'Entrar · Arena Beach Tennis' : 'Criar conta · Arena Beach Tennis',
    canActivate: [publicOnly],
    canDeactivate: [unsaved],
    loadComponent: () => import('./auth.component').then((m) => m.AuthComponent),
  })),
  {
    path: 'reservar',
    title: 'Reservar quadra · Arena Beach Tennis',
    canActivate: [authenticated],
    data: { role: Perfil.Cliente },
    loadComponent: () => import('./booking.component').then((m) => m.BookingComponent),
  },
  {
    path: 'minhas-reservas',
    title: 'Minhas reservas · Arena Beach Tennis',
    canActivate: [authenticated],
    data: { role: Perfil.Cliente },
    loadComponent: () => import('./reservations.component').then((m) => m.ReservationsComponent),
  },
  {
    path: 'meus-dados',
    title: 'Meus dados · Arena Beach Tennis',
    canActivate: [authenticated],
    canDeactivate: [unsaved],
    data: { role: Perfil.Cliente },
    loadComponent: () => import('./profile.component').then((m) => m.ProfileComponent),
  },
  { path: 'admin', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  ...[
    {
      path: 'dashboard',
      title: 'Dashboard',
      component: () => import('./dashboard.component').then((m) => m.DashboardComponent),
    },
    {
      path: 'reservas',
      title: 'Grade de reservas',
      component: () => import('./grade.component').then((m) => m.GradeComponent),
    },
    {
      path: 'quadras',
      title: 'Quadras',
      component: () => import('./courts.component').then((m) => m.CourtsComponent),
    },
    {
      path: 'clientes',
      title: 'Clientes',
      component: () => import('./clients.component').then((m) => m.ClientsComponent),
    },
    {
      path: 'pagamentos',
      title: 'Pagamentos',
      component: () => import('./payments.component').then((m) => m.PaymentsComponent),
    },
  ].map((r) => ({
    path: 'admin/' + r.path,
    title: r.title + ' · Arena Beach Tennis',
    canActivate: [authenticated],
    canDeactivate: [unsaved],
    data: { role: Perfil.Administrador },
    loadComponent: r.component,
  })),
  {
    path: '**',
    title: 'Página não encontrada',
    loadComponent: () => import('./not-found.component').then((m) => m.NotFoundComponent),
  },
];
