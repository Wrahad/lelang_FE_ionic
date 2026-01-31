import { Injectable } from "@angular/core";
import { ToastController } from '@ionic/angular/standalone';
import { environment } from "src/environments/environment.prod";

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private currentToast: HTMLIonToastElement | null = null;

  constructor(
    private toast: ToastController
  ) {}

  private async show(
    title: string,
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary',
    duration: number = 2000,
    icon?: string,
  ): Promise<void> {
    if (this.currentToast) {
      await this.currentToast.dismiss();
    }

    this.currentToast = await this.toast.create({
      header: title,
      message,
      duration,
      position: environment.locale.toastPosition,
      color,
      icon,
      buttons: [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel'
        }
      ],
    });

    await this.currentToast?.present();

    setTimeout(() => {
      this.currentToast = null;
    }, duration);
  }

  async showSuccess(message: string, title: string = 'Berhasil'): Promise<void> {
    await this.show(title, message, 'success', 2000, 'checkmark-circle');
  }

  async showError(message: string, title: string = 'Error'): Promise<void> {
    await this.show(title, message, 'danger', 2000, 'alert-circle');
  }

  async showWarning(message: string, title: string = 'Peringatan'): Promise<void> {
    await this.show(title, message, 'warning', 2000, 'warning');
  }

  async showInfo(message: string, title: string = 'Info'): Promise<void> {
    await this.show(title, message, 'primary', 2000, 'information-circle');
  }

  async showLoading(message: string): Promise<void> {
    if (this.currentToast) {
      await this.currentToast.dismiss();
    }

    this.currentToast = await this.toast.create({
      header: 'Memproses...',
      message,
      position: environment.locale.toastPosition,
      color: 'secondary',
      duration: 10000, 
      icon: 'hourglass',
    });

    await this.currentToast.present();
  }

  async close(): Promise<void> {
    if (this.currentToast) {
      await this.currentToast.dismiss();
      this.currentToast = null;
    }
  }
}