import { Component, Input } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IonButton, IonSpinner],
  templateUrl: './app-button.component.html',
  styleUrls: ['./app-button.component.scss']
})
export class AppButtonComponent {
  @Input() variant: 'primary'|'outline' = 'primary';
  @Input() loading = false;
  @Input() disabled = false;
}