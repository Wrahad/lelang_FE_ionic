import { Injectable } from "@angular/core";
import { ApiResponse, ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { ToastService } from "./toast.service";
import { catchError, map, Observable, tap, throwError } from "rxjs";
import { User } from "src/app/models/user.model";


export interface UpdateProfileRequest {
    name?: string;
    telepon_pembeli?: string;
    alamat_pembeli?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    constructor(
        private api: ApiService,
        private toast: ToastService,
        private auth: AuthService,
    ) {}

    // Observable dari auth service
    public user$: Observable<User | null> = this.auth.currentUser$;

    public get isVerified(): boolean {
        return this.auth.isVerified();
    }

    public get isPending(): boolean {
        return this.auth.currentUser?.pembeli?.status_verifikasi === 'pending';
    }

    public get isRejected(): boolean {
        return this.auth.currentUser?.pembeli?.status_verifikasi === 'rejected';
    }

    getProfile(): Observable<User | null> {
        return this.api.get<ApiResponse<User>>('/auth/profile', undefined, true). pipe(
            map(res => res.data as User),
            tap(user => {
                this.auth.updateCurrentUser(user);
            }),
            catchError(err => {
                    this.toast.showError(err.userMessage || 'Gagal memuat profil');
                    return throwError(() => err);
                }
            )
        )
    }

    updateProfile(payload: UpdateProfileRequest): Observable<User> {
        return this.api.patch<ApiResponse<User>>('pembeli/profile', payload, true).pipe(
            map(res => res.data as User),
            tap(updatedUser => {
                this.auth.updateCurrentUser(updatedUser);
                this.toast.showSuccess('Profil berhasil diperbarui');
            }),
            catchError(err => {
                this.toast.showError(err.userMessage || 'Gagal memperbarui profil');
                return throwError(() => err);
            })
        );
    }

    uploadKtp(ktpFile: File): Observable<User> {
        const formData = new FormData();
        formData.append('foto_ktp', ktpFile, ktpFile.name);
        formData.append('_method', 'PATCH');

        return this.api.upload<ApiResponse<User>>('/pembeli/profile/ktp', formData, 'POST').pipe(
            map(res => res.data as User),
            tap(updatedUser => {
                this.auth.updateCurrentUser(updatedUser);
                this.toast.showSuccess('Foto KTP berhasil diunggah, menunggu verifikasi');
            }),
            catchError(err => {
                this.toast.showError(err.userMessage || 'Gagal mengunggah foto KTP');
                return throwError(() => err);
            })
        );
    }

}

// import { Injectable } from '@angular/core';
// import { Observable, throwError } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';

// import { ApiService, ApiResponse } from './api.service';
// import { ToastService } from './toast.service';
// import { AuthService } from './auth.service';
// import { User } from 'src/app/models/user.model';

// export interface UpdateProfileRequest {
//   name?: string;
//   telepon_pembeli?: string;
//   alamat_pembeli?: string;
// }

// @Injectable({ providedIn: 'root' })
// export class ProfileService {
//   constructor(
//     private api: ApiService,
//     private toast: ToastService,
//     private auth: AuthService
//   ) {}

//   /** Sumber kebenaran user ada di AuthService */
//   getProfile(): Observable<User> {
//     return this.auth.getProfile();
//   }

//   /** Update profil teks → delegasi ke AuthService */
//   updateProfile(profileData: UpdateProfileRequest): Observable<User> {
//     return this.auth.updateProfile(profileData);
//   }

//   /** Upload KTP (multipart PATCH) → delegasi ke AuthService */
//   uploadKtp(ktpFile: File): Observable<User> {
//     return this.auth.uploadKtp(ktpFile);
//   }

//   /** Cek status verifikasi (pending/approved/rejected) */
//   cekStatusVerifikasi(): Observable<{
//     status_verifikasi: string;
//     alasan_penolakan: string | null;
//     foto_ktp_url: string | null;
//   }> {
//     return this.api.get<ApiResponse<any>>('/pembeli/verifikasi/status', undefined, true).pipe(
//       map((res) => {
//         if (!res.success) throw new Error(res.message || 'Gagal mengambil status verifikasi');
//         return res.data;
//       }),
//       catchError((err) => {
//         this.toast.showError(err.userMessage || 'Gagal mengambil status verifikasi');
//         return throwError(() => err);
//       })
//     );
//   }

//   /** Ubah password (AuthController::updatePassword) */
//   changePassword(currentPassword: string, newPassword: string): Observable<void> {
//     const data = {
//       current_password: currentPassword,
//       new_password: newPassword,
//       new_password_confirmation: newPassword
//     };

//     return this.api.put<ApiResponse<any>>('/auth/update-password', data, true).pipe(
//       map((res) => {
//         if (!res.success) throw new Error(res.message || 'Gagal mengubah password');
//         return;
//       }),
//       catchError((err) => {
//         this.toast.showError(err.userMessage || 'Gagal mengubah password');
//         return throwError(() => err);
//       })
//     );
//   }
// }
