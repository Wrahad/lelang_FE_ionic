import { Injectable } from "@angular/core";
import { IonRouterOutlet, Platform } from "@ionic/angular/standalone";
import { NavigationService } from "./navigation.service";
import { App as CapacitorApp } from '@capacitor/app';


@Injectable({
    providedIn: 'root'
})
export class BackButtonHandlerService {
    private routerOutlet?: IonRouterOutlet;
    private readonly ROOT_PAGES = ['/home/lelang', '/home', '/'];

    constructor(
        private platform: Platform,
        private navigation: NavigationService
    ) {}

    setRouterOutlet(outlet: IonRouterOutlet): void {
        this.routerOutlet = outlet;
    }

    initialize(): void {
        this.platform.ready().then(() => {
            if (!this.platform.is('capacitor')) {
                return;
            }
            CapacitorApp.addListener('backButton', () => {
                this.handleBackButton();
            });
        });
    }

    private handleBackButton(): void {
        const currentUrl = this.navigation.getCurrentUrl();

        if (this.isRootPage(currentUrl)) {
            CapacitorApp.exitApp();
            return;
        }

        if (this.routerOutlet?.canGoBack()) {
            this.routerOutlet.pop();
            return;
        }

        this.navigation.navigateToHome();
    }

    private isRootPage(url: string): boolean {
        return this.ROOT_PAGES.includes(url);
    }

    goBack(): void {
        this.handleBackButton();
    }
}