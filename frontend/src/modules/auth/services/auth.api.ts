/**
 * Auth API Service
 * Handles all authentication-related API calls
 */

const API_BASE = '/api/auth';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneCountry?: string;
  description?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    token: string;
  };
  message?: string;
  error?: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{ message: string; path: string[] }>;
}

class AuthApi {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Set auth token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Make API request with optional auth header
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<ApiResponse> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await this.request<{ user: AuthUser; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response as AuthResponse;
  }

  /**
   * Logout (client-side only)
   */
  logout(): void {
    this.setToken(null);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request('/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<ApiResponse> {
    return this.request('/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<{ user: AuthUser }>> {
    return this.request<{ user: AuthUser }>('/me');
  }

  /**
   * Get Google OAuth URL
   */
  getGoogleAuthUrl(): string {
    return `${API_BASE}/google`;
  }
}

export const authApi = new AuthApi();
export default authApi;
