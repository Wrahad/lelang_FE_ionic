import { Environment } from "./environment.interface";

export const environment: Environment = {
  production: true,

  api: {
    baseUrl: 'http://192.168.88.215:8000/api',
    timeout: 5000,
    retryAttempts: 3,
  },

  auth: {
    googleClientId: '1051132488231-1qj2kt7vh7t3qd2cc0tibqihsr0oiv52.apps.googleusercontent.com',
    tokenScheme: 'Bearer',
    sanctum: {
      profileEndpoint: '/auth/profile',
      usesCookieSpa: false,
    },
  },

  locale: {
    currency: {
      locale: 'id-ID',
      code: 'IDR',
    },
    toastPosition: 'top',
  },

  features: {
    enableLogging: false,
    enableAnalytics: true,
    enableMockData: false,
  }
}