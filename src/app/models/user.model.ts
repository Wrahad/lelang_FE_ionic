export interface User {
  id: number;
  name: string;
  email: string;
  role: 'pembeli' | 'admin';
  created_at: string;
  updated_at: string;
  pembeli?: Pembeli | null;
}

export interface Pembeli {
  id?: number;
  user_id?: number;
  alamat_pembeli?: string | null;
  telepon_pembeli?: string | null;
  foto_ktp?: string | null;
  foto_ktp_url?: string | null;
  status_verifikasi?: 'pending' | 'approved' | 'rejected' | null;
  alasan_penolakan?: string | null;
}

