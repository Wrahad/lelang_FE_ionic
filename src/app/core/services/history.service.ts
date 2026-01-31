import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { HistoryResponse } from 'src/app/models/history.model';


@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  getAuctionHistory(): Observable<HistoryResponse> {
    return this.api.get<HistoryResponse>('/pembeli/history', undefined, true).pipe(
      map(response => {
        console.log('Raw API Response:', response);
        console.log('Response structure:', {
          success: response.success,
          message: response.message,
          summary: response.summary,
          data: response.data,
          dataLength: response.data?.length || 0
        });
        if (!response.success) {
          throw new Error(response.message || 'Gagal memuat riwayat lelang.');
        }
        return response;
      }),
      catchError(error => {
        this.toast.showError(error.userMessage ||'Gagal memuat riwayat lelang.');
        return throwError(() => error);
      })
    );
  }
}