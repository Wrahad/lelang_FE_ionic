import { CommonModule } from "@angular/common";
import { IonicModule } from '@ionic/angular';
import { Component, Injectable, isStandalone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { addIcons } from 'ionicons';
import { timeOutline, createOutline, trophyOutline, trendingDownOutline, 
  refreshOutline, archiveOutline, pricetag, trophy, closeCircle } from 'ionicons/icons'; 
import { HistoryService } from "src/app/core/services/history.service";
import { Router } from "@angular/router";
import { AuthService } from "src/app/core/services/auth.service";
import { HistoryItem, HistorySummary } from "src/app/models/history.model";

@Component({
  selector: 'app-riwayat',
  templateUrl: './riwayat.page.html',
  styleUrls: ['./riwayat.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonicModule
  ]
})
export class RiwayatPage implements OnInit {
  constructor(
    private historyService: HistoryService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      'time-outline': timeOutline,
      'create-outline': createOutline,
      'trophy-outline': trophyOutline,
      'trending-down-outline': trendingDownOutline,
      'refresh-outline': refreshOutline,
      'archive-outline': archiveOutline,
      'pricetag': pricetag,
      'trophy': trophy,
      'close-circle': closeCircle
    })
  }

  summary: HistorySummary | null = null;
  historyItems: HistoryItem[] = [];
  isLoading = true;
  isVerified = false;

  ngOnInit() {
    this.isVerified = this.authService.isVerified();
    this.loadHistory();
  }

  loadHistory(event?: any) {
    if (!event) {
      this.isLoading = true;
    }

    if (!this.isVerified) {
      this.isLoading = false;
      this.historyItems = [];
      this.summary = null;
      if (event) {
        setTimeout(() => {
          event.target.complete();
        }, 300);
      }
      return;
    }

    this.historyService.getAuctionHistory().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.summary = res.summary;
          this.historyItems = res.data;
        }
        this.isLoading = false;
        event?.target.complete();
      },
      error: () => {
        this.isLoading = false;
        event?.target.complete();
      }
    });
  }

  handleRefresh(event: any) {
    this.isVerified = this.authService.isVerified();
    this.loadHistory(event);
  }

  goToProfile() {
    this.router.navigateByUrl('home/profil');
  }
}