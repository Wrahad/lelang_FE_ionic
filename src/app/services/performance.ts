import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

// Deklarasi global untuk Android interface
declare global {
  interface Window {
    AndroidBridge?: {
      postMessage: (message: string) => void;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private appStartTime: number = 0;
  private ttiLogged: boolean = false;

  constructor() {
    // Catat waktu saat service di-instantiate (sangat awal)
    this.appStartTime = Date.now();
  }

  /**
   * Log ke native Android via Capacitor bridge
   * Ini akan muncul di logcat dengan tag "Capacitor/Console"
   */
  private nativeLog(message: string): void {
    // Console.log untuk Chrome DevTools
    console.log(message);
    
    // Jika di platform native, gunakan Capacitor bridge
    if (Capacitor.isNativePlatform()) {
      try {
        // Capacitor console logging
        (window as any).Capacitor?.Plugins?.Console?.log?.({ message });
      } catch (e) {
        // Fallback - tidak ada action
      }
    }
  }

  /**
   * Marker untuk benchmark script - dipanggil di halaman pertama (Login)
   * Menggunakan ionViewDidEnter() untuk akurasi maksimal
   */
  markTTI(): void {
    if (this.ttiLogged) return;
    this.ttiLogged = true;

    const ttiDuration = Date.now() - this.appStartTime;
    
    // Marker utama untuk benchmark script 
    // Format: TTI_DONE:<timestamp_ms>
    const marker = `TTI_DONE:${ttiDuration}`;
    
    console.log('BENCHMARK_TTI_DONE');
    console.log(`[PERF] ${marker}`);
    
    // Post ke native bridge jika tersedia
    if (Capacitor.isNativePlatform()) {
      // Gunakan document title sebagai fallback untuk marker
      // logcat akan menampilkan document title changes
      document.title = `TTI:${ttiDuration}ms`;
    }
  }

  /**
   * Get TTI duration in ms (untuk dibaca oleh script benchmark)
   */
  getTTI(): number {
    return Date.now() - this.appStartTime;
  }

  /**
   * Reset flag untuk pengujian berulang (cold start simulation)
   */
  reset(): void {
    this.ttiLogged = false;
    this.appStartTime = Date.now();
  }
}

