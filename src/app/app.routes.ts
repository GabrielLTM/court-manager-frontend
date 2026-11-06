import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Routes, Router } from '@angular/router';
import { AppState } from './app-state';
import { Perfil } from '@/core/domain/enums';
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
    loadComponent: () => import('@/features/auth/auth').then((m) => m.AuthComponent),
  })),
  {
    path: 'reservar',
    title: 'Reservar quadra · Arena Beach Tennis',
    canActivate: [authenticated],
    data: { role: Perfil.Cliente },
    loadComponent: () =>
      import('@/features/reservas/reservar/reservar').then((m) => m.ReservarComponent),
  },
  {
    path: 'minhas-reservas',
    title: 'Minhas reservas · Arena Beach Tennis',
    canActivate: [authenticated],
    data: { role: Perfil.Cliente },
    loadComponent: () =>
      import('@/features/reservas/minhas-reservas/minhas-reservas').then(
        (m) => m.MinhasReservasComponent,
      ),
  },
  {
    path: 'meus-dados',
    title: 'Meus dados · Arena Beach Tennis',
    canActivate: [authenticated],
    canDeactivate: [unsaved],
    data: { role: Perfil.Cliente },
    loadComponent: () => import('@/features/clientes/meus-dados').then((m) => m.MeusDadosComponent),
  },
  { path: 'admin', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  ...[
    {
      path: 'dashboard',
      title: 'Dashboard',
      component: () => import('@/features/dashboard/dashboard').then((m) => m.DashboardComponent),
    },
    {
      path: 'reservas',
      title: 'Grade de reservas',
      component: () => import('@/features/reservas/grade/grade').then((m) => m.GradeComponent),
    },
    {
      path: 'quadras',
      title: 'Quadras',
      component: () => import('@/features/quadras/quadras').then((m) => m.QuadrasComponent),
    },
    {
      path: 'clientes',
      title: 'Clientes',
      component: () => import('@/features/clientes/clientes').then((m) => m.ClientesComponent),
    },
    {
      path: 'pagamentos',
      title: 'Pagamentos',
      component: () =>
        import('@/features/pagamentos/pagamentos').then((m) => m.PagamentosComponent),
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
    loadComponent: () => import('./not-found').then((m) => m.NotFoundComponent),
  },
];
