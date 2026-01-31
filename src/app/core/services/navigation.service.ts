import { NavigationExtras, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class NavigationService {
    constructor(
        private router: Router,
        private authService: AuthService,
    ) {}

    handleInitialRouting(): void {
        const currentUrl = this.router.url;
        const isAuthenticated = this.authService.isAuthenticated();

        if (!isAuthenticated) {
            if (!currentUrl.startsWith('/auth')) {
                this.navigateToLogin();
            }
        return;
        }

        const publicPages = ['/auth/login', '/', ''];
        if (publicPages.includes(currentUrl)) {
            this.navigateToHome();
        }
    }

    navigateToLogin(): void {
        this.router.navigate(['/auth/login'], { replaceUrl: true});
    }

    navigateToHome(): void {
        this.router.navigate(['/home/lelang'], { replaceUrl: true});
    }

    navigateTo(route: string[], extras?: NavigationExtras): void {
        this.router.navigate(route, extras);
    }

    isCurrentRoute(route: string): boolean {
        return this.router.url === route;
    }

    getCurrentUrl(): string {
        return this.router.url;
    }
    
}