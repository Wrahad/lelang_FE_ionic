export interface Bid {
  id: number;
  lelang_id: number;           // ✅ Sesuai dengan backend (bukan auction_id)
  user_id: number;
  user_name?: string;          // Optional, dari relasi user
  harga_penawaran: number;     // ✅ Sesuai dengan backend (bukan amount)
  is_pemenang?: boolean;       // ✅ Sesuai dengan backend (bukan is_winner)
  created_at: string;
  updated_at?: string;
}

export interface CreateBidRequest {
  lelang_id?: number;          // ✅ Optional karena biasanya diambil dari URL parameter
  harga_penawaran: number;     // ✅ Sesuai dengan backend
}

export interface BidResponse {
  success: boolean;
  message: string;
  data: {                      // ✅ Biasanya backend Laravel wrap dalam 'data'
    id: number;
    lelang_id: number;         // ✅ Konsisten dengan backend
    user_id: number;
    harga_penawaran: number;   // ✅ Konsisten dengan backend
    is_pemenang: boolean;      // ✅ Konsisten dengan backend
    created_at: string;
    updated_at: string;
  };
}

// Helper interfaces untuk mapping
export interface BidWithRelations extends Bid {
  lelang?: {
    id: number;
    nama_lelang: string;
    status: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}