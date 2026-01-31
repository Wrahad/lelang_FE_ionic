import { User } from './user.model';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface GoogleLoginRequest {
    id_token?: string;
    access_token?: string;
}


export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    token_type: string;
  }
}