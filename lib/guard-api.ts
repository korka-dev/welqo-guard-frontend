const API_BASE_URL = "https://projet-genetics-api.onrender.com/api/v1"

// Types corrigés et ajustés au backend
export interface GuardBase {
  name: string
  phone_number: string
}

export interface GuardCreateRequest extends GuardBase {
  password: string
}

export interface GuardLoginRequest {
  username: string // phone_number
  password: string
}

export interface GuardLoginResponse {
  access_token: string
  token_type: string
  user_name: string
}

export interface GuardOut extends GuardBase {
  id: string
  created_at: string
}

export interface QRScanRequest {
  form_id: string // UUID as string
}

export interface QRConfirmRequest {
  form_id: string // UUID as string
  confirmed: boolean
}

export interface QRScanData {
  user: {
    name: string
    phone_number: string
    appartement: string
  }
  visitor: {
    name: string
    phone_number: string
  }
  created_at: string // ISO string
  expires_at: string // ISO string
  form_id: string // UUID as string
}

export interface QRScanResponse {
  valid: boolean
  message: string
  data?: QRScanData
}

export interface QRConfirmResponse {
  success: boolean
  message: string
  scan_id?: string
}

export interface GuardQRScan {
  id: string
  form_id: string
  guard_id: string
  confirmed?: boolean
  scanned_at: string
  created_at: string
  updated_at: string
  visitor_name?: string
  visitor_phone?: string
  resident_name?: string
  resident_phone?: string
  resident_apartment?: string
  expires_at?: string
  valid?: boolean
}

export interface GuardCreateResponse {
  id: string;
  name: string;
  phone_number: string;
  created_at: string;
}


export interface GuardStats {
  today_scans: number
  today_approved: number
  today_denied: number
  guard_name: string
}

export interface ApiResponse<T> {
  data: T
  status: number
  error?: string
}

class GuardApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    this.token = this.getStoredToken()
  }

  private getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("guard_access_token")
    }
    return null
  }

  private setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("guard_access_token", token)
    }
  }

  private removeToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("guard_access_token")
      localStorage.removeItem("guard_name")
    }
  }

  private getAuthHeaders(): HeadersInit {
    return this.token
      ? { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" }
  }

  private async handleRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers = this.getAuthHeaders()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          this.removeToken()
          if (typeof window !== "undefined") {
            window.location.href = "/guard/login"
          }
        }
        return {
          data: null as any,
          status: response.status,
          error: errorData.detail || "An error occurred",
        }
      }

      const data = await response.json()
      return {
        data,
        status: response.status,
      }
    } catch (error: any) {
      console.error("API Error:", error)
      return {
        data: null as any,
        status: 500,
        error: error.message || "An error occurred",
      }
    }
  }

  // Authentication Methods
  async loginGuard(credentials: GuardLoginRequest): Promise<ApiResponse<GuardLoginResponse>> {
    const formData = new URLSearchParams()
    formData.append("username", credentials.username)
    formData.append("password", credentials.password)

    const response = await this.handleRequest<GuardLoginResponse>("/guard/login", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    if (response.status === 200 && response.data) {
      const loginData = response.data as GuardLoginResponse
      this.setToken(loginData.access_token)
      if (typeof window !== "undefined") {
        localStorage.setItem("guard_name", loginData.user_name)
      }
    }

    return response
  }

  async createGuard(guardData: GuardCreateRequest): Promise<ApiResponse<GuardCreateResponse>> {
    return this.handleRequest<GuardCreateResponse>("/guards/create-guard", {
      method: "POST",
      body: JSON.stringify(guardData),
      headers: this.getAuthHeaders(),
    });
  }

  async scanQRCode(formId: string): Promise<ApiResponse<QRScanResponse>> {
    console.log("=== APPEL API scanQRCode (avec form_id) ===")
    console.log("Form ID envoyé:", formId)
    console.log("Token d'auth présent:", !!this.token)

    const payload = { form_id: formId }

    try {
      const response = await this.handleRequest<QRScanResponse>("/guard-scans/scan", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: this.getAuthHeaders(),
      })

      console.log("Réponse de l'API:", response)
      return response
    } catch (error) {
      console.error("Erreur dans scanQRCode:", error)
      throw error
    }
  }

  async confirmScan(formId: string, confirmed: boolean): Promise<ApiResponse<QRConfirmResponse>> {
    return this.handleRequest("/guard-scans/confirm", {
      method: "POST",
      body: JSON.stringify({
        form_id: formId,
        confirmed: confirmed,
      }),
      headers: this.getAuthHeaders(),
    })
  }

  async getScanHistory(limit?: number): Promise<ApiResponse<GuardQRScan[]>> {
    const params = limit ? `?limit=${limit}` : ""
    return this.handleRequest(`/guard-scans/history${params}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })
  }

  async getGuardStats(): Promise<ApiResponse<GuardStats>> {
    return this.handleRequest("/guard-scans/stats", {
      method: "GET",
      headers: this.getAuthHeaders(),
    })
  }

  // Récupérer le profil du gardien
  async getGuardProfile(): Promise<ApiResponse<GuardOut>> {
    return this.handleRequest("/guard/profile", {
      method: "GET",
      headers: this.getAuthHeaders(),
    })
  }

   async logoutGuard(): Promise<void> {
    try {
      // Call the logout endpoint to invalidate the token on the server
      await this.handleRequest("/guard/logout", {
        method: "POST",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Remove the token from local storage and the client
      this.removeToken();
    }
  }



  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token
  }

  getCurrentToken(): string | null {
    return this.token
  }

  getStoredGuardName(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("guard_name")
    }
    return null
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  isQRCodeValid(expiresAt: string): boolean {
    try {
      const expirationDate = new Date(expiresAt)
      const now = new Date()
      return now <= expirationDate
    } catch (error) {
      return false
    }
  }
}

// Create a singleton instance
export const guardApiClient = new GuardApiClient()


