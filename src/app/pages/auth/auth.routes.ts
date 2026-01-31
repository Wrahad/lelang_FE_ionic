import { Routes } from "@angular/router";
import { autoLoginGuard } from "src/app/core/guards/auto-login.guard";

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import ('./login/login.page').then(m => m.LoginPage),
        data: {
            title: 'Login',
            animation: 'Fade',
        },
        canActivate: [autoLoginGuard],
    },
//     {
//     path: 'register',
//     loadComponent: () => 
//       import('./register/register.page').then(m => m.RegisterPage),
//     data: { title: 'Register' }
//   },
//   {
//     path: 'forgot-password',
//     loadComponent: () => 
//       import('./forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
//     data: { title: 'Forgot Password' }
//   },
]