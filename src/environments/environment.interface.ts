export interface Environment {
    // Core settings
    production: boolean;

    // API Configuration
    api: {
        baseUrl: string;
        timeout: number;
        retryAttempts: number;
    };

    // Authentication
    auth: {
        googleClientId: string;
        tokenScheme: 'Bearer' | 'Token';
        sanctum: {
            profileEndpoint: string;
            usesCookieSpa: boolean;
        };
    };

    // Localization
    locale: {
        currency: {
            locale: string;
            code: string;
        };
        toastPosition: 'top' | 'bottom' | 'middle';
    };

    // Feature Flags 
    features?: {
        enableLogging: boolean;
        enableAnalytics: boolean;
        enableMockData: boolean;
    }
}