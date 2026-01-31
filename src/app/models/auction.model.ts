import { Bid } from './bid.model';

export interface Auction {
  id: number;
  product_name: string;
  description?: string;
  start_price: number;
  current_price?: number;
  min_increment: number;
  starts_at: string;
  ends_at: string;
  status: 'dibuka' | 'ditutup' | 'selesai';
  images?: string[];
  total_stock: number;
  category?: string;

  // Backend returns number directly from user_bid_price field
  user_latest_bid?: number | null;
  bid_count?: number;
  can_bid?: boolean; 
  created_at: string;
  updated_at: string;
}