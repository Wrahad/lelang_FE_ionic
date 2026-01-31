import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; 

import { Auction } from '../../../models/auction.model';
import { Bid } from '../../../models/bid.model';

@Component({
  selector: 'app-auction-card',
  templateUrl: './auction-card.component.html',
  styleUrls: ['./auction-card.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AuctionCardComponent implements OnInit, OnChanges {
  @Input() auction!: Auction;
  @Input() userBid?: Bid | null | undefined;
  @Input() isSubmitting = false;
  @Input() canBid = false;
  @Input() canUserBid = false;

  @Output() bidSubmitted = new EventEmitter<{ auction: Auction; amount: number }>();

  @Output() auctionClick = new EventEmitter<void>();

  public bidAmount: number | null = null;
  public errorMessage: string | null = null;

  ngOnInit() {
    this.updateBidAmount();
  }

  /**
   * ✅ FIX: Dipanggil setiap kali @Input() berubah (termasuk saat refresh)
   */
  ngOnChanges(changes: SimpleChanges) {
    // DEBUG
    if (changes['userBid']) {
      console.log('[AuctionCard] userBid changed:', changes['userBid'].currentValue);
    }
    
    if (changes['userBid'] || changes['auction']) {
      this.updateBidAmount();
    }
  }

  /**
   * ✅ Helper: Update bidAmount dari userBid
   */
  private updateBidAmount() {
    if (this.userBid && this.userBid.harga_penawaran) {
      this.bidAmount = this.userBid.harga_penawaran;
    }
    // Backend returns user_latest_bid as number directly (from user_bid_price)
    else if (typeof this.auction?.user_latest_bid === 'number') {
      this.bidAmount = this.auction.user_latest_bid;
    }
  }

  onCardClick() {
    this.auctionClick.emit();
  }


submitBid() {
  if (!this.canUserBid) {
    this.bidSubmitted.emit({ auction: this.auction, amount: 0 }); // Kirim amount dummy
    return; // Berhenti di sini untuk user tak terverifikasi.
  }

  if (!this.bidAmount || this.bidAmount <= 0) {
    this.errorMessage = 'Masukkan jumlah penawaran yang valid.';
    return;
  }

  if (this.bidAmount <= this.auction.start_price) {
    this.errorMessage = `Tawaran harus lebih tinggi dari harga awal (Rp ${this.auction.start_price.toLocaleString('id-ID')}).`;
    return;
  }

  if (this.auction.min_increment && (this.bidAmount % this.auction.min_increment !== 0)) {
    this.errorMessage = `Tawaran harus kelipatan dari kenaikan minimum (Rp ${this.auction.min_increment.toLocaleString('id-ID')}).`;
    return;
  }

  this.errorMessage = null;

  this.bidSubmitted.emit({
    auction: this.auction,
    amount: this.bidAmount,
  });
}

}
