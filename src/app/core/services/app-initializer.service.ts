import { Injectable } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Platform } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root'})

export class AppInitializerService {
    constructor(
        private platform: Platform
    ) {}

    async initialize(): Promise<void> {
        await this.platform.ready();

        await Promise.all([
            this.initializeStatusBar(),
            this.initializeSocialLogin(),
        ]);

        if (!environment.production && environment.features?.enableLogging) {
            console.log('✅ App initialized successfully');
        }
    }

    private async initializeStatusBar(): Promise<void> {
        try {
            if (!this.platform.is('capacitor')) {
                this.logWarning('StatusBar: Not running on Capacitor plaform');
                return;
            }

            await StatusBar.setStyle({ style: Style.Light});
            await StatusBar.setBackgroundColor({ color: '#059669' });

            this.logSuccess('StatusBar initialized');
        } catch (error) {
            this.logError('StatusBar initialization failed', error);
        }
    }

    private async initializeSocialLogin(): Promise<void> {
        try {
            await SocialLogin.initialize({
                google: {
                    webClientId: environment.auth.googleClientId,
                    redirectUrl: window.location.origin,
                }
            });

            this.logSuccess('SocialLogin initialized');
        } catch (error) {
            this.logError('SocialLogin initialization failed', error);
        }
    }

    private logSuccess(mesaage: string): void {
        if (!environment.production && environment.features?.enableLogging) {
            console.log(`✅ ${mesaage}`);
        }
    }

    private logWarning(message: string): void {
        if (!environment.production && environment.features?.enableLogging) {
            console.warn(`⚠️ ${message}`);
        }
    }

    private logError(message: string, error: any): void {
        if (!environment.production && environment.features?.enableLogging) {
            console.error(`❌ ${message}:`, error);
        }
    }
}