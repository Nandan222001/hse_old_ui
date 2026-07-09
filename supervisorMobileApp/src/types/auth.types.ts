export interface LoginRequest {
  employee_id: string;
  password: string;
}

export interface User {
  id: string;
  employee_id: string;
  name: string;
  role: string;
  zone?: string;
  site?: string;
  department?: string;
  avatar_url?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
