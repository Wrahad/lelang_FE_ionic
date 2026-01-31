import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { autoLoginGuard } from "./core/guards/auto-login.guard";

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [autoLoginGuard],
    loadChildren: () => import('./pages/auth/auth.routes').then(m => m.AUTH_ROUTES),
    data: {
      preload: false,
    }
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/layout/layout.page').then(m => m.LayoutPage),
    loadChildren: () => import('./pages/home/home.routes').then(m => m.HOME_ROUTES),
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  }
];