export interface HistorySummary {
  total_lelang_diikuti: number;
  total_menang: number; 
  total_kalah: number;
}

export interface HistoryProduk {
  id: number;
  nama_produk: string;
  foto_produk: string;
  jenis_produk_id: number;
  deskripsi_produk: string;
  deskripsi: string; // Untuk backward compatibility
  jenis_produk?: {
    nama_jenis: string;
  };
}

export interface HistoryItemLelang {
  id: number;
  nama_lelang: string;
  produk_id: number;
  produk: HistoryProduk;
  harga_awal: number;
  harga_akhir: number | null;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_stock: number;
  created_at: string;
  updated_at: string;
}

export interface HistoryItem {
  id: number;
  lelang: HistoryItemLelang;
  harga_penawaran: number;
  harga_pemenang: number;
  status: 'Menang' | 'Kalah';
}

export interface HistoryResponse {
  success: boolean;
  message: string;
  summary: HistorySummary;
  data: HistoryItem[];
}