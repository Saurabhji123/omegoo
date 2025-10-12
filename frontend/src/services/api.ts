// API Service for Omegoo Frontend

// Use production URL in production, localhost in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_BACKEND_URL_PROD || 'https://omegoo-api-clean.onrender.com')
  : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');

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
  login: async (credentials: { deviceId: string; userAgent: string; fingerprint?: string }) => {
    return apiService.post<{ token: string; user: any }>('/api/auth/login', credentials);
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