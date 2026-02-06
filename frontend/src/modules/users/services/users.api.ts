/**
 * Users API Service
 * API calls for user profile operations
 */

import { createLogger } from '../../../lib/logger';

const logger = createLogger('UsersApi');

// ============================================================================
// Types
// ============================================================================

export interface PublicUserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  profilePicture: string | null;
  description: string | null;
}

export interface FullUserProfile extends PublicUserProfile {
  email: string;
  phone: string | null;
  phoneCountry: string | null;
  emailVerified: boolean;
  userType: 'regular' | 'admin';
  videoLanguage: string;
  interfaceLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  phoneCountry?: string | null;
  description?: string | null;
  videoLanguage?: string;
  interfaceLanguage?: string;
}

export interface UploadResult {
  url: string;
  filename: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ============================================================================
// API Service
// ============================================================================

class UsersApiService {
  private baseUrl = '/api';

  private get token(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        ...options.headers,
      };

      // Add Content-Type for JSON requests (but not for FormData)
      if (!(options.body instanceof FormData)) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
      }

      // Add auth token if available
      if (this.token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data: data.data };
    } catch (error) {
      logger.error(`API request failed: ${error}`);
      return { error: 'Network error' };
    }
  }

  /**
   * Get public profile by nickname
   */
  async getPublicProfile(nickname: string): Promise<ApiResponse<PublicUserProfile>> {
    return this.request<PublicUserProfile>(`/users/${nickname}`);
  }

  /**
   * Get own full profile (requires auth)
   */
  async getOwnProfile(): Promise<ApiResponse<FullUserProfile>> {
    return this.request<FullUserProfile>('/users/me/profile');
  }

  /**
   * Update own profile (requires auth)
   */
  async updateProfile(input: UpdateProfileInput): Promise<ApiResponse<FullUserProfile>> {
    return this.request<FullUserProfile>('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  /**
   * Upload profile picture (requires auth)
   */
  async uploadProfilePicture(file: File): Promise<ApiResponse<UploadResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<UploadResult>('/upload/profile-picture', {
      method: 'POST',
      body: formData,
    });
  }
}

export const usersApi = new UsersApiService();
export default usersApi;
