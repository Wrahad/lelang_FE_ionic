import { 
  HttpClient, 
  HttpErrorResponse, 
  HttpHeaders, 
  HttpParams, 
  HttpEvent,
  HttpUploadProgressEvent,
  HttpResponse 
} from "@angular/common/http";
import { environment } from "src/environments/environment.prod";
import { StorageService } from "./storage.service";
import { Injectable, Injector } from "@angular/core";
import { catchError, from, map, Observable, retry, switchMap, throwError, timeout, TimeoutError } from "rxjs";
import { AuthService } from "./auth.service";

export interface ApiError {
  status: number;
  userMessage: string;
  originalError: HttpErrorResponse
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
} 

export interface UploadProgress<T = any> {
  type: 'progress' | 'complete';
  loaded: number;
  total: number;
  percentage: number;
  data?: T;
}

@Injectable({providedIn: 'root'})
export class ApiService {
  private readonly baseUrl = environment.api.baseUrl;
  private readonly requestTimeout = environment.api.timeout;
  private readonly retryAttempts = environment.api.retryAttempts;
  
  private readonly authPaths = [
    '/auth/login',
    '/auth/google-login',
    '/auth/register',
    '/auth/refresh',
    '/auth/google',
  ];

  private readonly mutationPaths = [
    '/lelang/bid',
    '/payment',
    '/upload',
  ];

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private injector: Injector,
  ) {}

  get<T>(
    endpoint: string,
    params?: Record<string, any>,
    requireAuth = false
  ): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.request<T>('GET', endpoint, undefined, requireAuth, httpParams, true);
  }

  post<T>(
    endpoint: string,
    data?: any,
    requireAuth = true
  ): Observable<T> {
    return this.request<T>('POST', endpoint, data, requireAuth, undefined, false);
  }

  put<T>(
    endpoint: string,
    data?: any,
    requireAuth = true
  ): Observable<T> {
    return this.request<T>('PUT', endpoint, data, requireAuth, undefined, false);
  }

  patch<T>(
    endpoint: string,
    data?: any,
    requireAuth = true
  ): Observable<T> {
    return this.request<T>('PATCH', endpoint, data, requireAuth, undefined, false);
  }

  delete<T>(
    endpoint: string, 
    requireAuth = true
  ): Observable<T> {
    return this.request<T>('DELETE', endpoint, undefined, requireAuth, undefined, false);
  }

  upload<T = any>(
    endpoint: string,
    formData: FormData,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST'
  ): Observable<T> {
    const withAuth = !this.isAuthEndpoint(endpoint);

    return from(this.getHeaders(withAuth, false)).pipe(
      switchMap((headers) => {
        return this.http.request<T>(method, this.buildUrl(endpoint), {
          headers,
          body: formData,
        });
      }),
      catchError(this.handleError)
    );
  }

  // upload<T = any>(
  //   endpoint: string,
  //   formData: FormData,
  //   method: 'POST' | 'PUT' | 'PATCH' = 'POST'
  // ): Observable<UploadProgress<T>> {
  //   const withAuth = !this.isAuthEndpoint(endpoint);

  //   return from(this.getHeaders(withAuth, false)).pipe(
  //     switchMap((headers) => {
  //       const request = this.http.request(method, this.buildUrl(endpoint), {
  //         headers,
  //         body: formData,
  //         reportProgress: true,
  //         observe: 'events',
  //       });
        
  //       // Type assertion untuk menghindari error tipe
  //       return request as Observable<HttpEvent<T>>;
  //     }),
  //     map((event: HttpEvent<T>) => {
  //       return this.transformUploadEvent<T>(event);
  //     }),
  //     catchError(this.handleError)
  //   ) as Observable<UploadProgress<T>>;
  // }

  private request<T>(
    method: string,
    endpoint: string,
    body?: any,
    requireAuth = false,
    params?: HttpParams,
    shouldRetry = false
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const withAuth = requireAuth && !this.isAuthEndpoint(endpoint);
    const isFormData = body instanceof FormData;

    return from(this.getHeaders(withAuth, !isFormData)).pipe(
      switchMap((headers) => {
        const options: {
          headers: HttpHeaders;
          params?: HttpParams;
          responseType?: 'json';
        } = { headers, responseType: 'json' as const };
        
        if (params) options.params = params;

        let request$: Observable<T>;
        switch (method) {
          case 'GET':
            request$ = this.http.get<T>(url, options);
            break;
          case 'POST':
            request$ = this.http.post<T>(url, body, options);
            break;
          case 'PUT':
            request$ = this.http.put<T>(url, body, options);
            break;
          case 'PATCH':
            request$ = this.http.patch<T>(url, body, options);
            break;
          case 'DELETE':
            request$ = this.http.delete<T>(url, options);
            break;
          default:
            return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
        }

        request$ = request$.pipe(
          timeout(this.requestTimeout)
        );

        if (shouldRetry && !this.isMutationEndpoint(endpoint)) {
          request$ = request$.pipe(
            retry({
              count: this.retryAttempts,
              delay: 1000,
              resetOnSuccess: true,
            })
          );
        }
        return request$;
      }),
      catchError(this.handleError)
    );
  }

  private buildUrl(endpoint: string): string {
    const base = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${ep}`;
  }

  private isAuthEndpoint(endpoint: string): boolean {
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return this.authPaths.some((p) => ep.includes(p));
  }

  private isMutationEndpoint(endpoint: string): boolean {
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return this.mutationPaths.some((p) => ep.includes(p));
  }

  private async getHeaders(
    requireAuth = false,
    isJson = true
  ): Promise<HttpHeaders> {
    let headers = new HttpHeaders({ Accept: 'application/json' });
    if (isJson) headers = headers.set('Content-Type', 'application/json');

    if (requireAuth) {
      const token = await this.storage.getToken();
      if (token) {
        headers = headers.set('Authorization', `${environment.auth.tokenScheme} ${token}`)
      }
    }

    return headers;
  }

  private transformUploadEvent<T>(event: HttpEvent<T>): UploadProgress<T> {
    if (event.type === 1) {
      // HttpUploadProgressEvent
      const progressEvent = event as HttpUploadProgressEvent;
      return {
        type: 'progress',
        loaded: progressEvent.loaded,
        total: progressEvent.total || 100,
        percentage: progressEvent.total 
          ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
          : 0,
      };
    } 
    
    if (event.type === 4) {
      // HttpResponse
      const responseEvent = event as HttpResponse<T>;
      return {
        type: 'complete',
        loaded: 100,
        total: 100,
        percentage: 100,
        data: responseEvent.body as T,
      };
    }
    
    // Default untuk event type lainnya
    return {
      type: 'progress',
      loaded: 0,
      total: 100,
      percentage: 0,
    };
  }

  private handleError = (error: any): Observable<never> => {
    let message = 'Terjadi kesalahan pada server';
    let status = 0;

    if (error instanceof TimeoutError) {
      message = `Request timeout. Silakan coba lagi.`;
      status = 408;
    }
    else if (error instanceof HttpErrorResponse) {
      status = error.status;

      if (error.error instanceof ErrorEvent) {
        message = error.error.message;
      } else {
        switch (status) {
          case 0:
            message = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
            break;
          case 400:
            message = error.error?.message || 'Permintaan tidak valid.';
            break;
          case 401:
            if (error.url && (error.url.includes('/auth/login') || error.url.includes('/auth/google'))) {
              message = error.error?.message || 'Email atau password yang Anda masukkan salah.';
            } else {
              message = 'Sesi Anda berakhir. Silakan login kembali.';
              setTimeout(() => {
                const authService = this.injector.get(AuthService);
                authService.logout().subscribe();
              }, 1500);
            }
            break;
          case 403:
            message = 'Anda tidak memiliki akses untuk melakukan aksi ini.';
            break;
          case 404:
            message = 'Data yang diminta tidak ditemukan.';
            break;
          case 422:
            if (error.error?.errors) {
              const firstError = Object.values(error.error.errors)[0] as string[];
              message = firstError?.[0] || 'Data yang dikirim tidak valid.';
            } else {
              message = error.error?.message || 'Data yang dikirim tidak valid.';
            }
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            message = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
            break;
          default:
            message = error.error?.message || error.message || message;
        }
      }
    }
    else {
      message = 'Terjadi kesalahan tidak terduga.';
    }

    if (environment.features?.enableLogging) {
      console.error('[ApiService] Error:', {
        status,
        message,
        error: error,
        timestamp: new Date().toISOString(),
      });
    }

    const apiError: ApiError = {
      status,
      userMessage: message,
      originalError: error,
      timestamp: new Date().toISOString(),
    };

    return throwError(() => apiError);
  }
}