import { inject } from "@angular/core"
import { AuthService } from "../services/auth.service";
import { CanActivateFn, Router } from "@angular/router";

export const authGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    await authService.waitForInitialization();

    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated) {
        return true;
    } else {
        router.navigateByUrl('/auth/login', { replaceUrl: true });
        return false;
    }
}