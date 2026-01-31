import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject } from "@angular/core";

export const autoLoginGuard: CanActivateFn = async (routes, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    await authService.waitForInitialization();

    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated) {
        router.navigateByUrl('/home', { replaceUrl: true });
        return false;
    }
    else {
        return true;
    }
}