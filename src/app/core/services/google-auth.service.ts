// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { SocialLogin } from '@capgo/capacitor-social-login';
// import { environment } from 'src/environments/environment';


// export interface GoogleLoginResponse {
//   idToken?: string;
//   accessToken?: string;
//   email?: string;
//   name?: string;
//   imageUrl?: string;
//   raw?: any;
// }

// @Injectable({ providedIn: 'root' })
// export class GoogleAuthService {

//   constructor() {}

  

//   async signIn(): Promise<GoogleLoginResponse | null> {
//     await this.init();

//     const res = await SocialLogin.login({
//         provider: 'google',
//         options: { scopes: ['email', 'profile'], forceRefreshToken: true },
//       });
//     return {
//         idToken: (res as any)?.idToken,
//         accessToken: (res as any)?.accessToken,
//         email: (res as any)?.email,
//         name: (res as any)?.name,
//         imageUrl: (res as any)?.imageUrl,
//         raw: res,
//       };
//   }

//  async signOut(): Promise<void> {
//     try {
//       await SocialLogin.logout({ provider: 'google' });
//     } catch { /* ignore */ }
//   }
  
// }


