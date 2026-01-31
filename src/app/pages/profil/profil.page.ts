import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonIcon, IonAvatar, IonChip,
  IonButton, IonSpinner, IonModal, ModalController} from '@ionic/angular/standalone';
import { ProfileService } from 'src/app/core/services/profile.service';
import { UploadKtpModalComponent } from 'src/app/shared/components/upload-ktp-modal/upload-ktp-modal.component';
import { firstValueFrom, map } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  person, checkmarkCircle, call, locationOutline, 
  warning, time, eye, close, checkmark, documentTextOutline,
  analyticsOutline, personCircle, refreshOutline,
  imageOutline, scaleOutline, alertOutline, createOutline
} from 'ionicons/icons';
import { UpdateProfileRequest } from 'src/app/core/services/profile.service';
import { EditProfileModalComponent } from 'src/app/shared/components/edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
  standalone: true,
  imports: [
  CommonModule, FormsModule,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton,
  IonContent, IonCard, IonCardContent, IonIcon, IonAvatar, IonChip,
  IonButton, IonSpinner, IonModal,
]
})
export class ProfilPage implements OnInit {

  user$ = this.profileService.user$;
  showImageModal = false;
  previewImageUrl = '';

  constructor(
    public profileService: ProfileService,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      person, checkmarkCircle, call, locationOutline, 
      warning, time, eye, close, checkmark, documentTextOutline,
      analyticsOutline, personCircle, refreshOutline,
      imageOutline, scaleOutline, alertOutline, createOutline
    });
  }
  ngOnInit() {
    this.profileService.getProfile().subscribe();
  }

  async openKtpUploadDialog() {
    const user = await firstValueFrom(this.user$);
    const m = await this.modalCtrl.create({
      component: UploadKtpModalComponent,
      componentProps: {
        initialPreview: user?.pembeli?.foto_ktp_url || ''
      },
      cssClass: 'upload-ktp-modal',
      backdropDismiss: false,
    });
    await m.present();

    const {role} = await m.onDidDismiss();
    if (role === 'uploaded') {
      await firstValueFrom(this.profileService.getProfile());
    }
  }

  private async getEditableSnapshot(): Promise<UpdateProfileRequest> {
    const snap = await firstValueFrom(this.user$.pipe(
      map((u) => ({
        name: u?.name || '',
        telepon_pembeli: u?.pembeli?.telepon_pembeli || '',
        alamat_pembeli: u?.pembeli?.alamat_pembeli || '',
      }))
    ));
    return snap;
  }

  async openEditProfileModal(): Promise<void> { 
    const editable = await this.getEditableSnapshot();
    const modal = await this.modalCtrl.create({
      component: EditProfileModalComponent,
      componentProps: {
        user: editable
      },
      cssClass: 'edit-profile-modal',
      backdropDismiss: false,
    });
    await modal.present();

    const {data, role} = await modal.onWillDismiss<UpdateProfileRequest | null >();

    if (role === 'saved' && data) {
      console.log('Profile updated successfully');
    }
  }

  openImagePreview(url?: string | null) {
    if (!url) {
      return;
    }
    this.previewImageUrl = url;
    this.showImageModal = true;
  }

  closeImagePreview() {
    this.showImageModal = false;
  }



}

