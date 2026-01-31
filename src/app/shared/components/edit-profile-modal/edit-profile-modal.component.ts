import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService, UpdateProfileRequest } from 'src/app/core/services/profile.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { firstValueFrom } from 'rxjs';

export type EditableBuyerProfile = {
  name: string;
  telepon_pembeli: string;
  alamat_pembeli: string;
};

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class EditProfileModalComponent implements OnInit {
  @Input() user?: Partial<UpdateProfileRequest>;

  isSaving = false;

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    telepon_pembeli: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
    alamat_pembeli: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalCtrl: ModalController,
    private readonly profileService: ProfileService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    if (this.user) this.profileForm.patchValue(this.user);
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

 async save(): Promise<void> {
    if (this.profileForm.invalid) {
      this.toast.showError('Harap isi semua field dengan benar.');
      this.profileForm.markAllAsTouched(); 
      return;
    }

    if (this.isSaving) return;

    this.isSaving = true;

    try {
      const updatedData = this.profileForm.getRawValue();
      await firstValueFrom(this.profileService.updateProfile(updatedData));
      this.modalCtrl.dismiss(updatedData, 'saved');
    }catch (error) {
      console.error('Save profile error', error);
    } finally {
      this.isSaving = false;
    }
  }
}
 