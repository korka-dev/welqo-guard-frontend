const API_BASE_URL = 'http://localhost:8000/api/v1';

// Types corrigés et ajustés au backend
export interface GuardBase {
  name: string;
  phone_number: string;
}

export interface GuardCreateRequest extends GuardBase {
  password: string;
}

export interface GuardLoginRequest {
  username: string; // phone_number
  password: string;
}

export interface GuardLoginResponse {
  access_token: string;
  token_type: string;
  user_name: string;
}

export interface GuardOut extends GuardBase {
  id: string;
  created_at: string;
}

export interface QRScanRequest {
  qr_code_data: string;
}

export interface QRConfirmRequest {
  qr_code_data: string;
  confirmed: boolean;
}

export interface QRScanResponse {
  valid: boolean;
  message: string;
  data?: {
    user: {
      name: string;
      phone_number: string;
      appartement: string;
    };
    visitor: {
      name: string;
      phone_number: string;
    };
    created_at: string;
    expires_at: string;
    form_id: string;
  };
}

export interface QRConfirmResponse {
  success: boolean;
  message: string;
  scan_id?: string;
}

export interface GuardQRScan {
  id: string;
  scanned_at: string;
  confirmed?: boolean;
  status: string;
  qr_code_data: string;
  visitor_name?: string;
  visitor_phone?: string;
  resident_name?: string;
  resident_apartment?: string;
  expires_at?: string;
}

export interface GuardStats {
  today_scans: number;
  today_approved: number;
  today_denied: number;
  guard_name: string;
}

export interface TestQRCode {
  qr_code_data: string;
  visitor_name: string;
  resident_name: string;
  expires_at: string;
  valid: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}

class GuardApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guard_access_token');
    }
    return null;
  }

  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('guard_access_token', token);
    }
  }

  private removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guard_access_token');
      localStorage.removeItem('guard_name');
    }
  }

  private getAuthHeaders(): HeadersInit {
    return this.token
      ? { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  private async handleRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/guard/login';
          }
        }
        return {
          data: null as any,
          status: response.status,
          error: errorData.detail || 'An error occurred',
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error: any) {
      console.error('API Error:', error);
      return {
        data: null as any,
        status: 500,
        error: error.message || 'An error occurred',
      };
    }
  }

  // Authentication Methods
  async createGuard(guardData: GuardCreateRequest): Promise<ApiResponse<GuardOut>> {
    return this.handleRequest<GuardOut>('/guards/create-guard', {
      method: 'POST',
      body: JSON.stringify(guardData),
    });
  }

  async loginGuard(credentials: GuardLoginRequest): Promise<ApiResponse<GuardLoginResponse>> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await this.handleRequest<GuardLoginResponse>('/guard/login', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (
      response.status === 200 &&
      response.data &&
      typeof response.data === 'object' &&
      'access_token' in response.data &&
      'user_name' in response.data
    ) {
      const loginData = response.data as GuardLoginResponse;
      this.setToken(loginData.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('guard_name', loginData.user_name);
      }
    }

    return response;
  }

  async logoutGuard(): Promise<ApiResponse<any>> {
    const response = await this.handleRequest('/guard/logout', {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (response.status === 200) {
      this.removeToken();
    }

    return response;
  }

  // QR Scan Methods
  async scanQRCode(qrCodeData: string): Promise<ApiResponse<QRScanResponse>> {
    return this.handleRequest('/guard-scans/scan', {
      method: 'POST',
      body: JSON.stringify({ qr_code_data: qrCodeData }),
      headers: this.getAuthHeaders(),
    });
  }

  async confirmScan(qrCodeData: string, confirmed: boolean): Promise<ApiResponse<QRConfirmResponse>> {
    return this.handleRequest('/guard-scans/confirm', {
      method: 'POST',
      body: JSON.stringify({
        qr_code_data: qrCodeData,
        confirmed: confirmed,
      }),
      headers: this.getAuthHeaders(),
    });
  }

  // History and Statistics Methods
  async getScanHistory(limit?: number): Promise<ApiResponse<GuardQRScan[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.handleRequest(`/guard-scans/history${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getGuardStats(): Promise<ApiResponse<GuardStats>> {
    return this.handleRequest('/guard-scans/stats', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getGuardScans(guardId: string): Promise<ApiResponse<GuardQRScan[]>> {
    return this.handleRequest(`/guard-scans/guard/${guardId}/scans`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async deleteScan(scanId: string): Promise<ApiResponse<any>> {
    return this.handleRequest(`/guard-scans/${scanId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // Guard Management Methods
  async getAllGuards(): Promise<ApiResponse<GuardOut[]>> {
    return this.handleRequest('/guards/all', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getGuard(guardId: string): Promise<ApiResponse<GuardOut>> {
    return this.handleRequest(`/guards/${guardId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async updateGuard(guardId: string, guardData: Partial<GuardBase>): Promise<ApiResponse<GuardOut>> {
    return this.handleRequest(`/guards/${guardId}`, {
      method: 'PUT',
      body: JSON.stringify(guardData),
      headers: this.getAuthHeaders(),
    });
  }

  async deleteGuard(guardId: string): Promise<ApiResponse<any>> {
    return this.handleRequest(`/guards/${guardId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // Test Methods
  async getTestQRCodes(): Promise<ApiResponse<{ test_qr_codes: TestQRCode[] }>> {
    return this.handleRequest('/guard-scans/test-qr-codes', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  // Method to get the profile of the logged-in guard - CORRIGÉ
  async getGuardProfile(): Promise<ApiResponse<GuardOut>> {
    return this.handleRequest<GuardOut>('/guards/profile', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getCurrentToken(): string | null {
    return this.token;
  }

  getStoredGuardName(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guard_name');
    }
    return null;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  isQRCodeValid(expiresAt: string): boolean {
    try {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      return now <= expirationDate;
    } catch (error) {
      return false;
    }
  }

  getScanStatus(confirmed?: boolean): string {
    if (confirmed === true) return 'Autorisé';
    if (confirmed === false) return 'Refusé';
    return 'En attente';
  }

  getScanStatusColor(confirmed?: boolean): string {
    if (confirmed === true) return '#10B981'; // Green
    if (confirmed === false) return '#EF4444'; // Red
    return '#F59E0B'; // Orange
  }
}

// Create a singleton instance
export const guardApiClient = new GuardApiClient();
