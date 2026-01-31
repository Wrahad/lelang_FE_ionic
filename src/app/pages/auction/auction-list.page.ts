import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule, ModalController, ToastController } from "@ionic/angular";
import { AuctionCardComponent } from "src/app/shared/components/auction-card/auction-card.component";
import { Auction } from "src/app/models/auction.model";
import { AuctionService } from "src/app/core/services/auction.service";
import { AuthService } from "src/app/core/services/auth.service";
import { Router } from "@angular/router";
import { VerificationNoticeComponent } from "src/app/shared/components/verification-notice/verification-notice.component";
import { addIcons } from 'ionicons';
import { 
  analyticsOutline, 
  personCircle, 
  refreshOutline, 
  imageOutline, 
  scaleOutline, 
  alertOutline,
  personCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: "app-auction-list",
  templateUrl: "./auction-list.page.html",
  styleUrls: ["./auction-list.page.scss"],
  standalone: true,
  imports: [CommonModule, IonicModule, AuctionCardComponent],
})
export class AuctionListPage implements OnInit {
  auctions: Auction[] = [];
  isLoading = true;
  submittingBids = new Set<number>();
  onAuctionClick(auction: Auction) {
    console.log('Auction card clicked:', auction.id);
  }

  constructor(
    private auctionService: AuctionService,
    public authService: AuthService,
    private toastController: ToastController,
    private modalCtrl: ModalController,
    private router: Router
  ) {
    addIcons({ 
      analyticsOutline, 
      personCircle, 
      refreshOutline, 
      imageOutline,
      scaleOutline,
      alertOutline,
      personCircleOutline
    });
  }

  ngOnInit() {
    this.loadAuctions();
  }

  handleRefresh(event: any) {
    this.loadAuctions(event, true);
  }

  trackByAuctionId(index: number, auction: Auction): number {
    return auction.id;
  }

  /**
   * Load auctions dengan user_bid langsung dari BE (1 request only!)
   * BE akan include user_bid jika Authorization header dikirim
   */
  loadAuctions(event?: any, force = false) {
    if (this.auctions.length === 0) {
      this.isLoading = true;
    }

    // Kirim auth header jika user sudah login, BE akan include user_bid di response
    const isAuthenticated = this.authService.isAuthenticated();
    
    this.auctionService.getActiveAuctions().subscribe({
      next: (auctions) => {
        
        // user_latest_bid sudah di-map dari response BE (user_bid)
        this.auctions = auctions;
        this.isLoading = false;
        event?.target?.complete();
      },
      error: () => {
        this.isLoading = false;
        event?.target?.complete();
      }
    });
  }

  onBidSubmitted(event: { auction: Auction; amount: number }) {
    const { auction, amount } = event;

    if (!this.authService.canBid) {
      this.showVerificationModal(); 
      return;
    }

    if (this.submittingBids.has(auction.id)) return;
    this.submittingBids.add(auction.id);

    this.auctionService.submitBid(auction.id, amount).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const auctionIndex = this.auctions.findIndex(a => a.id === auction.id);
          if (auctionIndex > -1) {
            this.auctions[auctionIndex].user_latest_bid = response.data.harga_penawaran;
            this.auctions = [...this.auctions];
          }
        }
      },
      error: (err) => {
        console.error('Bid submission failed:', err);
      },
      complete: () => {
        this.submittingBids.delete(auction.id);
      }
    });
  }

  isSubmittingBid(auctionid: number): boolean {
    return this.submittingBids.has(auctionid);
  }

  async showVerificationModal() {
    const modal = await this.modalCtrl.create({
      component: VerificationNoticeComponent,
      cssClass: 'dialog-modal',
      backdropDismiss: true
    });

    await modal.present();

    // Tunggu modal ditutup dan dapatkan 'role' nya
    const { role } = await modal.onDidDismiss();

    if (role === 'profile') {
      // Jika tombol 'Ke Profil' diklik, arahkan ke halaman profil
      this.router.navigateByUrl('/home/profil'); 
    }
  }

}