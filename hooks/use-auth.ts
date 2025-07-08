"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  username: string
  email?: string
  role?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  const checkAuthStatus = useCallback(async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        return
      }

      // Verify token with backend
      const response = await apiClient.get("/api/auth/me")
      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error("Auth check failed:", error)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      })
    }
  }, [])

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

      const response = await apiClient.login(credentials)

      setAuthState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw error
    } finally {
      window.location.href = "/"
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
      window.location.href = "/"
    }
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      await apiClient.refreshToken()
      await checkAuthStatus()
    } catch (error) {
      console.error("Token refresh failed:", error)
      await logout()
    }
  }, [checkAuthStatus, logout])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  // Set up token refresh interval
  useEffect(() => {
    if (authState.isAuthenticated) {
      const interval = setInterval(
        () => {
          refreshToken()
        },
        15 * 60 * 1000,
      ) // Refresh every 15 minutes

      return () => clearInterval(interval)
    }
  }, [authState.isAuthenticated, refreshToken])

  return {
    ...authState,
    login,
    logout,
    refreshToken,
    checkAuthStatus,
  }
}
