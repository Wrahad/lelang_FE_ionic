import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-input.component.html',
  styleUrls: ['./app-input.component.scss']
})
export class AppInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text'|'email'|'password' = 'text';
  @Input() disabled = false;
  @Input() value = '';

  @Output() valueChange = new EventEmitter<string>();

  onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value ?? '';
    this.valueChange.emit(v);
  }
}