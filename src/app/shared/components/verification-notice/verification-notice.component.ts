// src/app/shared/components/verification-notice/verification-notice.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons'; 
import { alertOutline } from 'ionicons/icons'; 

@Component({
  selector: 'app-verification-notice',
  templateUrl: './verification-notice.component.html',
  styleUrls: ['./verification-notice.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class VerificationNoticeComponent {

  constructor(private modalCtrl: ModalController) { 
    
    addIcons({ alertOutline });
  }

  dismiss(role: 'close' | 'profile') {
    this.modalCtrl.dismiss(null, role);
  }
}