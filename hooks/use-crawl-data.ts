"use client"

import { useState, useCallback, useEffect } from "react"
import type { URLData } from "@/types/crawler"
import { apiClient } from "@/lib/api-client"

export function useCrawlData() {
  const [urls, setUrls] = useState<URLData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch URLs on mount
  useEffect(() => {
    fetchURLs()
  }, [])

  const fetchURLs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get("/api/urls")
      // Handle both direct array response and wrapped response
      const urlsData = response.data?.data || response.data || []
      setUrls(Array.isArray(urlsData) ? urlsData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URLs")
      console.error("Error fetching URLs:", err)
      setUrls([]) // Ensure urls is always an array
    } finally {
      setLoading(false)
    }
  }, [])

  const addURL = useCallback(async (url: string) => {
    try {
      const response = await apiClient.post("/api/urls", { url })
      // Handle both direct response and wrapped response
      const newURL = response.data?.data || response.data
      if (newURL) {
        setUrls((prev) => [newURL, ...prev])
        return newURL
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add URL")
      throw err
    }
  }, [])

  const updateURLStatus = useCallback((url: string, status: URLData["status"], data?: Partial<URLData>) => {
    setUrls((prev) =>
      prev.map((u) => (u.url === url ? { ...u, status, ...data, updatedAt: new Date().toISOString() } : u)),
    )
  }, [])

  const deleteURLs = useCallback(async (urlIds: string[]) => {
    try {
      await apiClient.delete("/api/urls", { data: { ids: urlIds } })
      setUrls((prev) => prev.filter((u) => !urlIds.includes(u.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete URLs")
      throw err
    }
  }, [])

  const rerunAnalysis = useCallback(async (urlId: string) => {
    try {
      await apiClient.post(`/api/urls/${urlId}/rerun`)
      setUrls((prev) => prev.map((u) => (u.id === urlId ? { ...u, status: "queued" as const } : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rerun analysis")
      throw err
    }
  }, [])

  const startCrawling = useCallback(async (urlId: string) => {
    try {
      await apiClient.post(`/api/urls/${urlId}/start`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start crawling")
      throw err
    }
  }, [])

  const stopCrawling = useCallback(async (urlId: string) => {
    try {
      await apiClient.post(`/api/urls/${urlId}/stop`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop crawling")
      throw err
    }
  }, [])

  return {
    urls,
    loading,
    error,
    addURL,
    updateURLStatus,
    deleteURLs,
    rerunAnalysis,
    startCrawling,
    stopCrawling,
    refetch: fetchURLs,
  }
}
