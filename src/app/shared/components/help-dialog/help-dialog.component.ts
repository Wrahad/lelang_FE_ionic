import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { helpCircleOutline, informationCircle } from 'ionicons/icons';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class HelpDialogComponent {

  constructor(private modalCtrl: ModalController) {
    // Daftarkan icon yang dipakai
    addIcons({ helpCircleOutline, informationCircle });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}