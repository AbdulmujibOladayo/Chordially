export type UserRole = "fan" | "artist" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}
