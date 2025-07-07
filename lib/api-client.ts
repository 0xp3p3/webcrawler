"use client"

interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

interface ApiError {
  message: string
  status: number
  code?: string
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") {
    this.baseURL = baseURL
    this.defaultHeaders = {
      "Content-Type": "application/json",
    }
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token")
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders }
    const token = this.getAuthToken()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")

    let data: any
    if (isJson) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const error: ApiError = {
        message: data.message || data.error || `HTTP ${response.status}`,
        status: response.status,
        code: data.code,
      }

      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem("auth_token")
        window.location.href = "/login"
      }

      throw error
    }

    return {
      data: data.data || data,
      message: data.message,
      success: data.success !== false,
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T = any>(endpoint: string, options?: { data?: any }): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      body: options?.data ? JSON.stringify(options.data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.post<{ token: string; user: any }>("/api/auth/login", credentials)

    if (response.data.token) {
      localStorage.setItem("auth_token", response.data.token)
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await this.post("/api/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("auth_token")
    }
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.post<{ token: string }>("/api/auth/refresh")

    if (response.data.token) {
      localStorage.setItem("auth_token", response.data.token)
    }

    return response
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }
}

export const apiClient = new ApiClient()
