// upload-ktp-modal.component.ts
import { Component, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { ProfileService } from 'src/app/core/services/profile.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-upload-ktp-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './upload-ktp-modal.component.html',  
  styleUrls: ['./upload-ktp-modal.component.scss'],  
})
export class UploadKtpModalComponent {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  @Input() initialPreview?: string;

  pickedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;

  constructor(
    private modalCtrl: ModalController,
    private profileService: ProfileService,
    private toast: ToastService,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.previewUrl = this.initialPreview || null;
  }

  async pickImage() {
    if (this.platform.is('capacitor')) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos,
        });

        if (image.webPath) {
          this.previewUrl = image.webPath;

          const response = await fetch(image.webPath);
          const blob = await response.blob();
          this.pickedFile = new File([blob], 'ktp.jpg', { type: blob.type });

          if (!this.validateFile(this.pickedFile)) {
            this.clearPicked();
          }
        }
      } catch (e) {
        console.error('Gagal mengambil foto dari galeri', e);
      }
    } else {
      this.fileInput.nativeElement.click();
    }
  }

  validateFile(file: File): boolean {
    const okType = ['image/jpeg', 'image/png'].includes(file.type);
    const okSize = file.size <= 2 * 1024 * 1024; 

    if (!okType) {
      this.toast.showError('Format file tidak valid. Harap gunakan JPG atau PNG.');
      return false;
    }
    if (!okSize) {
      this.toast.showError('Ukuran file terlalu besar (Maksimal 2MB).');
      return false;
    }
    return true;
  }

  onFileChange(file: File | null) {
    if (!file) return;

    if (!this.validateFile(file)) {
      this.clearPicked(); 
      return;
    }

    this.pickedFile = file;

    const r = new FileReader();
    r.onload = () => (this.previewUrl = r.result as string);
    r.readAsDataURL(file);
  }

  clearPicked() {
    this.pickedFile = null;
    this.previewUrl = this.initialPreview || null;
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }

  async uploadKtpOnly() {
    if (!this.pickedFile) {
      this.toast.showError('Silakan pilih gambar KTP terlebih dahulu.');
      return;
    }
    
    this.isUploading = true;
    
    try {
      await firstValueFrom(this.profileService.uploadKtp(this.pickedFile));
      
      await this.modalCtrl.dismiss(true, 'uploaded'); 
    } catch (e) {
      console.error('Upload KTP gagal', e);
    } finally {
      this.isUploading = false;
    }
  }

  async closeModal() {
    await this.modalCtrl.dismiss();
  }


}
