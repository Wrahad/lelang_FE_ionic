import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/core/services/toast.service';
import { addIcons } from 'ionicons';
import { logIn, logInOutline, logoGoogle, alertCircleOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';
import { GoogleLoginRequest } from 'src/app/models/auth.model';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { PerformanceService } from '../../services/performance'; 

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner,
  ],
})
export class LoginPage implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  isLoading = false;
  showShake = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private toast: ToastService,
    private performance: PerformanceService
  ) {
    addIcons({logIn,logInOutline,logoGoogle,alertCircleOutline});
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * ionViewDidEnter - Dipanggil SETELAH halaman fully visible & animasi selesai
   * Ini adalah titik paling akurat untuk mengukur TTI
   */
  ionViewDidEnter(): void {
    this.performance.markTTI();
  }

  ionViewWillEnter(): void {
    // Reset form saat kembali ke halaman login
    if (this.form) {
      this.form.reset();
    }
    this.showShake = false;
  }

  private triggerShake(): void {
    this.showShake = true;
    setTimeout(() => {
      this.showShake = false;
    }, 500);
  }

  loginWithEmail(): void {
    if (this.isSubmitting) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.triggerShake();
      this.toast.showError('Mohon lengkapi form dengan benar');
      return;
    }

    this.isSubmitting = true;

    this.auth.loginWithEmail(this.form.value).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        this.toast.showSuccess(`Selamat datang, ${user?.name}!`);
        setTimeout(() => {
            // Ganti ke route yang benar
            this.router.navigateByUrl('/home/lelang', { replaceUrl: true });
          }, 500);
      },
      error: (err) => {
        const message = err.userMessage || 'Email atau password salah.';
        this.toast.showError(message);
        this.isSubmitting = false;
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    if (this.isLoading) return;

    try {
      this.isLoading = true;

      const result = await SocialLogin.login({
        provider: 'google',
        options: { scopes: ['email', 'profile'] },
      });

      const idToken = (result.result as any)?.idToken || 
                      (result.result as any)?.authentication?.idToken ||
                      (result as any)?.authentication?.idToken;

      if (idToken) {
        
        const req: GoogleLoginRequest = {
          id_token: idToken,
        };

        this.auth.loginWithGoogle(req).subscribe({
          next: (user) => {
            this.isLoading = false;
            this.toast.showSuccess(`Selamat datang, ${user?.name}!`);
            setTimeout(() => {
            
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            this.router.navigateByUrl('/home/lelang', { replaceUrl: true });
          }, 300);
          },
          error: (err) => {
            const message = err.userMessage || 'Login dengan Google gagal. Silakan coba lagi.';
            this.toast.showError(message);
            this.isLoading = false;
          }
        });

      } else {
        throw new Error('Google Sign-In gagal. idToken tidak ditemukan di dalam objek result.');
      }
    } catch (e: any) {
      this.isLoading = false;
      console.error('❌ Google Sign-In error:', e);
      if (e.message && !e.message.includes('canceled')) {
         this.toast.showError('Login dengan Google gagal. Silakan coba lagi.');
      }
    }
  }
}