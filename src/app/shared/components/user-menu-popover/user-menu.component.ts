import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverController, IonContent, IonList, IonItem, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, helpCircleOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-user-menu-popover',
  standalone: true,
  imports: [CommonModule, IonContent, IonList, IonItem, IonIcon],
  template: `
    <ion-content>
      <ion-list lines="none">
        <!-- Profile Item -->
        <ion-item button (click)="selectAction('profile')">
          <div class="popover-item-content">
            <div class="popover-icon-wrapper green">
              <ion-icon name="person-outline"></ion-icon>
            </div>
            <div class="popover-text">
              <div class="popover-title">{{ userName }}</div>
              <div class="popover-subtitle">{{ userEmail }}</div>
            </div>
          </div>
        </ion-item>

        <!-- Help Item -->
        <ion-item button (click)="selectAction('help')">
          <div class="popover-item-content">
            <div class="popover-icon-wrapper orange">
              <ion-icon name="help-circle-outline"></ion-icon>
            </div>
            <div class="popover-text">
              <div class="popover-title">Bantuan</div>
            </div>
          </div>
        </ion-item>

        <!-- Logout Item -->
        <ion-item button (click)="selectAction('logout')">
          <div class="popover-item-content">
            <div class="popover-icon-wrapper red">
              <ion-icon name="log-out-outline"></ion-icon>
            </div>
            <div class="popover-text">
              <div class="popover-title">Keluar</div>
            </div>
          </div>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    /* ✅ Add styles for popover content */
    .popover-item-content {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px 0;
    }

    .popover-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.green { background-color: #d1fae5; color: #047857; }
      &.orange { background-color: #fed7aa; color: #ea580c; }
      &.red { background-color: #fecaca; color: #dc2626; }
      
      ion-icon { font-size: 18px; }
    }

    .popover-text {
      flex: 1;
      
      .popover-title {
        font-weight: 500;
        color: #1f2937;
        margin: 0;
        font-size: 14px;
      }
      
      .popover-subtitle {
        font-size: 12px;
        color: #6b7280;
        margin: 2px 0 0 0;
      }
    }

    ion-item {
      --background: transparent;
      --border-width: 0;
      --padding-start: 16px;
      --padding-end: 16px;
      --inner-padding-end: 0;
      margin: 4px 0;
      border-radius: 8px;
      
      &:hover {
        --background: #f9fafb;
      }
      
      &:active {
        --background: #f0f0f0;
      }
      
      &[color="danger"]:hover {
        --background: #fef2f2;
      }
    }
  `]
})
export class UserMenuPopoverComponent {
  @Input() userName: string = '';
  @Input() userEmail: string = '';

  constructor(private popoverCtrl: PopoverController) {
    addIcons({ personOutline, helpCircleOutline, logOutOutline });
  }

  async selectAction(action: 'profile' | 'help' | 'logout') {
    console.log('🔍 Popover action selected:', action);
    await this.popoverCtrl.dismiss({ action });
  }
}