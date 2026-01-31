import { Injectable } from "@angular/core";
import { BehaviorSubject, catchError, filter, firstValueFrom, from, map, Observable, of, switchMap, take, tap, throwError, timeout } from "rxjs";
import { User } from "src/app/models/user.model";
import { ApiService } from "./api.service";
import { StorageService } from "./storage.service";
import { Router } from "@angular/router";
import { AuthResponse, GoogleLoginRequest, LoginRequest } from "src/app/models/auth.model";

export interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    loading: true,
    initialized: false,
  });

  readonly authState$ = this.authStateSubject.asObservable();
  readonly currentUser$ = this.authState$.pipe(map(state => state.user));
  readonly isAuthenticated$ = this.authState$.pipe(map(state => state.user !== null));
  readonly isLoading$ = this.authState$.pipe(map(state => state.loading));
  readonly isVerified$ = this.currentUser$.pipe(map(user => user?.pembeli?.status_verifikasi === 'approved'));

  get currentUser(): User | null {
    return this.authStateSubject.getValue().user;
  }

  get isLoading(): boolean {
    return this.authStateSubject.getValue().loading;
  }

  get isInitialized(): boolean {
    return this.authStateSubject.getValue().initialized;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.getValue().user !== null;
  }

  isVerified(): boolean {
    return this.currentUser?.pembeli?.status_verifikasi === 'approved';
  }

  get canBid(): boolean {
    return this.isVerified();
  }

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router,
  ) {}


  async initialize(): Promise<void> {
    this.setLoading(true);

    try {
      const token = await this.storage.getToken();
      const user = await this.storage.getUser();

      if (token && user) {
        const isValid = await this.validateToken(token);

        if (isValid) {
          this.setUser(user);
        } else {
          await this.storage.clearAllAuthData();
          this.setUser(null);
        }
      } else {
        this.setUser(null);
      }
    } catch (error) {
      console.error('[AuthService] Failed to initialize:', error);
      this.setUser(null);
    } finally {
      this.authStateSubject.next({
        ...this.authStateSubject.getValue(),
        loading: false,
        initialized: true,
      });
    }
  }

  // private async validateToken(token: string): Promise<boolean> {
  //   try {
  //     const payload = JSON.parse(atob(token.split('.')[1]));
  //     const exp = payload.exp;

  //     if (!exp) {
  //       return true;
  //     }

  //     const now = Math.floor(Date.now() / 1000);
  //     return exp > now;
  //   } catch (error) {
  //     console.error('[AuthService] Failed to decode token:', error);
  //     return false;
  //   }
  // }
  // src/app/core/services/auth.service.ts

  private async validateToken(token: string): Promise<boolean> {
    // 1. Cek jika token kosong
    if (!token || token.length < 5) {
      return false;
    }

    // 2. Cek apakah ini JWT (punya 3 bagian)
    const parts = token.split('.');

    // JIKA BUKAN 3 BAGIAN (Berarti ini PAT/Sanctum) -> ANGGAP VALID!
    // Biarkan Backend yang menolak jika memang salah (401 Unauthorized)
    if (parts.length !== 3) {
      return true; // 
    }

    // 3. Jika kebetulan JWT, coba cek expired-nya (opsional)
    try {
      // Fix error 'atob' dengan mengganti karakter url-safe
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
      }
      
      return true;
    } catch (e) {
      // Jika decode gagal, tetap return true agar tidak logout paksa
      // Asumsinya: Token yang tersimpan adalah token yang sah dari login sebelumnya
      console.warn('Token validation warning:', e);
      return true; 
    }
  }

  private setLoading(loading: boolean): void {
    this.authStateSubject.next({
      ...this.authStateSubject.getValue(),
      loading,
    })
  }

  private setUser(user: User | null): void {
    this.authStateSubject.next({
      ...this.authStateSubject.getValue(),
      user,
    })
  }

  updateCurrentUser(user: User | null): void {
    this.setUser(user);
  }

  loginWithGoogle(payload: GoogleLoginRequest): Observable<User | null> {
    this.setLoading(true);

    return this.api.post<AuthResponse>('/auth/google', payload, false).pipe(
      switchMap(response => this.handleLoginSuccess(response)),
      catchError(err => {
        console.error('[AuthService] Google login failed:', err);
        this.setLoading(false);
        this.setUser(null);
        return throwError(() => err);
      })
    )
  }

  loginWithEmail(credentials: LoginRequest): Observable<User | null> {
    this.setLoading(true);
    
    return this.api.post<AuthResponse>('/auth/login', credentials, false).pipe(
      switchMap(response => this.handleLoginSuccess(response)),
      catchError(err => {
        console.error('[AuthService] Email login failed:', err);
        this.setLoading(false);
        this.setUser(null);
        return throwError(() => err);
      })
    )
  }

  private handleLoginSuccess(response: AuthResponse): Observable<User> {
    const { access_token, user } = response.data;

    return from(this.storage.setToken(access_token)).pipe(
      switchMap(() => from(this.storage.setUser(user)) ),
      tap(() => {
        this.setUser(user);
        this.setLoading(false);
        this.router.navigate(['/home/lelang'], { replaceUrl: true});
      }),
      map(() => user)
    );
  }

  logout(): Observable<void> {
    this.setLoading(true);

    return from(this.storage.clearAllAuthData()).pipe(
      tap(() => {
        this.setUser(null);
        this.setLoading(false);
        this.router.navigate(['/auth/login'], { replaceUrl: true });
      })
    )
  }

  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;
    await firstValueFrom(
      this.authState$.pipe(
        map(state => state.initialized),
        filter(initialized => initialized === true), take(1),
        timeout(5000), 
        catchError(() => {
           console.error("[AuthService] waitForInitialization timed out");
           return of(true); 
        })
      )
    );
  }
}