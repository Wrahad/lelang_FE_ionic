import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ToastService } from './toast.service';
import { Auction } from 'src/app/models/auction.model';
import { Bid, BidResponse } from 'src/app/models/bid.model';


@Injectable({
  providedIn: 'root'
})

export class AuctionService {
  constructor(private api: ApiService, private toast: ToastService) {}

  private mapAuctionFromApi(api: any): Auction {
    return {
      id: api.id,
      product_name: api.nama_lelang ?? 'Lelang Tanpa Nama',
      description: api.produk?.deskripsi ?? '',
      start_price: Number(api.harga_awal ?? 0),
      current_price: Number(api.harga_akhir ?? api.harga_awal ?? 0), 
      starts_at: api.tanggal_mulai,
      ends_at: api.tanggal_selesai,
      min_increment: Number(api.min_increment ?? 250),
      status: api.status ?? 'ditutup',
      images: Array.isArray(api.foto_produk_lelang)
        ? api.foto_produk_lelang.map((f: any) => f?.foto_url).filter(Boolean)
        : [],
      total_stock: api.total_stock,
      category: api.produk?.jenis_produk?.nama_jenis,
      bid_count: api.pengajuan_lelang_count ?? 0, 
      can_bid: api.status === 'dibuka',
      created_at: api.created_at,
      updated_at: api.updated_at,
      // FIX: Backend returns 'user_bid_price', not 'user_bid'
      user_latest_bid: api.user_bid_price ?? null,
    };
  }

  /**
   * Get active auctions
   * @param requireAuth - Jika true, kirim Authorization header untuk mendapatkan user_bid
   */
  getActiveAuctions(requireAuth = false): Observable<Auction[]> {
    return this.api.get<ApiResponse<any[]>>('/public/lelang/active', undefined, true).pipe(
      tap(res => {
        // DEBUG: Backend returns 'user_bid_price' field
        console.log('[AuctionService] Raw response:', res);
        console.log('[AuctionService] First auction user_bid_price:', res.data?.[0]?.user_bid_price);
      }),
      map(res => (res.data || []).map(item => this.mapAuctionFromApi(item))),
      catchError(err => {
        // Jika error 404 atau data kosong, kembalikan array kosong tanpa toast error
        if (err.status === 404) {
          return of([]);
        }
        // Hanya tampilkan error untuk masalah koneksi/server sebenarnya
        if (err.status === 0 || err.status >= 500) {
          this.toast.showError('Gagal memuat lelang. Periksa koneksi Anda.');
        }
        return of([]); // Kembalikan array kosong agar UI tetap responsive
      })
    );
  }

  getMyLastBid(auctionId: number): Observable<Bid | null> {
    return this.api.get<ApiResponse<Bid>>(`/pembeli/pengajuan-lelang/lelang/${auctionId}/me`, undefined, true).pipe(
      map(res => res.data || null),
      catchError(() => of(null))
    )
  }

  submitBid(auctionId: number, amount: number): Observable<BidResponse> {
    const payload = {
      lelang_id: auctionId,
      harga_penawaran: amount,
    };
    return this.api.post<BidResponse>('/pembeli/pengajuan-lelang', payload, true).pipe(
      tap(res => {
        const message = res.message || 'Tawaran berhasil diajukan';
        this.toast.showSuccess(message);
      }),
      catchError(err => {
        this.toast.showError(err.userMessage || 'Gagal mengajukan tawaran');
        return throwError(() => err);
      })
    );
  }
  
}