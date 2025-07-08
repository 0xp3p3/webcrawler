"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import type { URLData } from "@/types/crawler"

interface PaginatedResponse {
  data: URLData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  success: boolean
}

interface UseCrawlDataReturn {
  urls: URLData[]
  pagination: PaginatedResponse["pagination"] | null
  loading: boolean
  error: string | null
  addURL: (url: string) => Promise<void>
  updateURLStatus: (url: string, status: URLData["status"], data?: Partial<URLData>) => void
  deleteURLs: (urlIds: string[]) => Promise<void>
  rerunAnalysis: (urlId: string) => Promise<void>
  fetchURLs: (params?: {
    page?: number
    limit?: number
    sort?: string
    order?: "asc" | "desc"
    search?: string
  }) => Promise<void>
  refreshData: () => Promise<void>
}

export function useCrawlData(): UseCrawlDataReturn {
  const [urls, setUrls] = useState<URLData[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse["pagination"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentParams, setCurrentParams] = useState<{
    page?: number
    limit?: number
    sort?: string
    order?: "asc" | "desc"
    search?: string
  }>({ page: 1, limit: 10, sort: "createdAt", order: "desc" })

  const fetchURLs = useCallback(
    async (params?: {
      page?: number
      limit?: number
      sort?: string
      order?: "asc" | "desc"
      search?: string
    }) => {
      try {
        setLoading(true)
        setError(null)

        const queryParams = { ...currentParams, ...params }
        setCurrentParams(queryParams)

        const response = await apiClient.get<PaginatedResponse>("/api/urls", queryParams)
        console.log(response)
        
        if (response.success && response.data) {
          setUrls(response.data.data || [])
          setPagination(response.data.pagination || null)
        } else {
          throw new Error("Invalid response format")
        }
      } catch (err: any) {
        console.error("Failed to fetch URLs:", err)
        setError(err.message || "Failed to fetch URLs")
        setUrls([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    },
    [currentParams],
  )

  const refreshData = useCallback(async () => {
    await fetchURLs(currentParams)
  }, [fetchURLs, currentParams])

  const addURL = useCallback(
    async (url: string) => {
      try {
        setError(null)
        const response = await apiClient.post<{ url: URLData }>("/api/urls", { url })

        if (response.success) {
          // Refresh the data to get updated pagination
          await refreshData()
        }
      } catch (err: any) {
        console.error("Failed to add URL:", err)
        setError(err.message || "Failed to add URL")
        throw err
      }
    },
    [refreshData],
  )

  const updateURLStatus = useCallback((url: string, status: URLData["status"], data?: Partial<URLData>) => {
    setUrls((prevUrls) =>
      prevUrls.map((urlData) => {
        if (urlData.url === url) {
          return {
            ...urlData,
            status,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        }
        return urlData
      }),
    )
  }, [])

  const deleteURLs = useCallback(
    async (urlIds: string[]) => {
      try {
        setError(null)
        await apiClient.delete("/api/urls", { data: { ids: urlIds } })

        // Refresh the data after deletion
        await refreshData()
      } catch (err: any) {
        console.error("Failed to delete URLs:", err)
        setError(err.message || "Failed to delete URLs")
        throw err
      }
    },
    [refreshData],
  )

  const rerunAnalysis = useCallback(async (urlId: string) => {
    try {
      setError(null)
      await apiClient.post(`/api/urls/${urlId}/rerun`)

      // Update the URL status to queued immediately
      setUrls((prevUrls) =>
        prevUrls.map((url) =>
          url.id === urlId ? { ...url, status: "queued" as const, updatedAt: new Date().toISOString() } : url,
        ),
      )
    } catch (err: any) {
      console.error("Failed to rerun analysis:", err)
      setError(err.message || "Failed to rerun analysis")
      throw err
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchURLs()
  }, []) // Only run on mount

  return {
    urls,
    pagination,
    loading,
    error,
    addURL,
    updateURLStatus,
    deleteURLs,
    rerunAnalysis,
    fetchURLs,
    refreshData,
  }
}
