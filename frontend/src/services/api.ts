// API Service for Omegoo Frontend

// Always use production URL for deployed app, localhost only for dev
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocalhost ? 'http://localhost:3001' : 'https://omegoo-api-clean.onrender.com';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // 🔒 Handle session replaced error (logged in from another device)
        if (data.code === 'SESSION_REPLACED') {
          console.warn('⚠️ Session replaced - logged in from another device');
          
          // Clear local storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Show alert to user
          alert('You have been logged in from another device. Please login again.');
          
          // Reload page to reset app state
          window.location.href = '/';
          
          throw new Error(data.error || 'Session replaced');
        }

        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiService = new ApiService(API_BASE_URL);

// Auth API
export const authAPI = {
  // Email/Password Authentication
  loginWithEmail: async (email: string, password: string) => {
    return apiService.post<{ token: string; user: any }>('/api/auth/login', { email, password });
  },

  register: async (email: string, username: string, password: string) => {
    return apiService.post<{ 
      token?: string; 
      user?: any; 
      requiresOTP?: boolean; 
      message?: string;
      email?: string;
      username?: string;
      pending?: boolean;
      otpExpiresInSeconds?: number;
    }>('/api/auth/register', { email, username, password });
  },

  verifyEmailOTP: async (email: string, otp: string) => {
    return apiService.post<{ success: boolean; token: string; user: any; message?: string }>(
      '/api/auth/verify-otp',
      { email, otp }
    );
  },

  resendEmailOTP: async (email: string) => {
    return apiService.post<{ success: boolean; message: string }>(
      '/api/auth/resend-otp',
      { email }
    );
  },

  // Google OAuth
  loginWithGoogle: async (idToken: string) => {
    return apiService.post<{ token: string; user: any }>('/api/auth/google', { idToken });
  },

  getCurrentUser: async () => {
    return apiService.get<any>('/api/auth/me');
  },

  requestOTP: async (phone: string) => {
    return apiService.post<{ success: boolean }>('/api/auth/request-otp', { phone });
  },

  verifyPhone: async (data: { phone: string; otp: string }) => {
    return apiService.post<any>('/api/auth/verify-phone', data);
  },

  logout: async () => {
    return apiService.post<{ success: boolean }>('/api/auth/logout');
  },

  changePassword: async (currentPassword: string | undefined, newPassword: string) => {
    return apiService.post<{ success: boolean; message: string }>('/api/auth/change-password', { 
      currentPassword, 
      newPassword 
    });
  }
};

// User API
export const userAPI = {
  updateProfile: async (updates: any) => {
    return apiService.put<any>('/api/user/profile', updates);
  },

  updatePreferences: async (preferences: any) => {
    return apiService.put<any>('/api/user/preferences', preferences);
  },

  getCoins: async () => {
    return apiService.get<{ coins: number }>('/api/user/coins');
  },

  deleteAccount: async () => {
    return apiService.delete<{ success: boolean }>('/api/user/account');
  }
};

// Chat API
export const chatAPI = {
  getHistory: async (limit: number = 20, offset: number = 0) => {
    return apiService.get<any[]>(`/api/chat/history?limit=${limit}&offset=${offset}`);
  },

  reportUser: async (data: {
    sessionId: string;
    violationType: string;
    description: string;
    evidence?: string[];
  }) => {
    return apiService.post<{ success: boolean }>('/api/chat/report', data);
  }
};

// Moderation API (for frame upload)
export const moderationAPI = {
  uploadFrame: async (frameData: {
    sessionId: string;
    frameData: string;
    timestamp: number;
    width: number;
    height: number;
  }) => {
    return apiService.post<{ flagged: boolean; confidence: number }>('/api/moderation/frame', frameData);
  }
};

// Payment API
export const paymentAPI = {
  createCoinPurchase: async (data: {
    amount: number;
    coins: number;
    paymentMethod: string;
  }) => {
    return apiService.post<{ orderId: string; paymentUrl?: string }>('/api/payment/coins', data);
  },

  createSubscription: async (data: {
    type: string;
    duration: string;
    paymentMethod: string;
  }) => {
    return apiService.post<{ subscriptionId: string; paymentUrl?: string }>('/api/payment/subscription', data);
  },

  verifyPayment: async (data: {
    orderId: string;
    paymentId: string;
    signature?: string;
  }) => {
    return apiService.post<{ success: boolean; coins?: number }>('/api/payment/verify', data);
  }
};

// Admin API
export const adminAPI = {
  getReports: async (page: number = 1, limit: number = 20) => {
    return apiService.get<{ reports: any[]; total: number }>(`/api/admin/reports?page=${page}&limit=${limit}`);
  },

  getBannedUsers: async (page: number = 1, limit: number = 20) => {
    return apiService.get<{ users: any[]; total: number }>(`/api/admin/bans?page=${page}&limit=${limit}`);
  },

  reviewReport: async (reportId: string, action: string, reason?: string) => {
    return apiService.post<{ success: boolean }>(`/api/admin/reports/${reportId}/review`, { action, reason });
  },

  banUser: async (data: {
    userId: string;
    reason: string;
    type: string;
    duration?: number;
  }) => {
    return apiService.post<{ success: boolean }>('/api/admin/ban', data);
  },

  unbanUser: async (userId: string, reason: string) => {
    return apiService.post<{ success: boolean }>(`/api/admin/unban/${userId}`, { reason });
  },

  getAnalytics: async (dateRange?: { start: string; end: string }) => {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
    return apiService.get<any>(`/api/admin/analytics${params}`);
  }
};

// Export the main service
export default apiService;