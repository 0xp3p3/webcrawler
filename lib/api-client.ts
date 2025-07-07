import axios, { type AxiosInstance, type AxiosError } from "axios"
import { env } from "./env"

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token")
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user")
          window.location.href = "/login"
        }
        return Promise.reject(error)
      },
    )
  }

  async get(url: string, config = {}) {
    try {
      const response = await this.client.get(url, config)
      return response.data
    } catch (error) {
      console.error("API GET Error:", error)
      throw this.handleError(error)
    }
  }

  async post(url: string, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config)
      return response.data
    } catch (error) {
      console.error("API POST Error:", error)
      throw this.handleError(error)
    }
  }

  async put(url: string, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config)
      return response.data
    } catch (error) {
      console.error("API PUT Error:", error)
      throw this.handleError(error)
    }
  }

  async delete(url: string, config = {}) {
    try {
      const response = await this.client.delete(url, config)
      return response.data
    } catch (error) {
      console.error("API DELETE Error:", error)
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || "Server error"
      return new Error(`${message} (${error.response.status})`)
    } else if (error.request) {
      // Request was made but no response received
      return new Error("Network error - please check your connection")
    } else {
      // Something else happened
      return new Error(error.message || "Unknown error occurred")
    }
  }
}

export const apiClient = new ApiClient()
