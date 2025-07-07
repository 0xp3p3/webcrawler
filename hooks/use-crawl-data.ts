"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { useWebSocket } from "./use-websocket"
import type { CrawlResult } from "@/types/crawler"

interface UseCrawlDataReturn {
  urls: CrawlResult[]
  isLoading: boolean
  error: string | null
  addUrl: (url: string) => Promise<void>
  deleteUrl: (id: string) => Promise<void>
  deleteUrls: (ids: string[]) => Promise<void>
  refreshData: () => Promise<void>
}

export function useCrawlData(): UseCrawlDataReturn {
  const [urls, setUrls] = useState<CrawlResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket connection for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket()

  const fetchUrls = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await apiClient.get("/api/urls")

      // Handle different response structures
      let urlData: CrawlResult[] = []
      if (Array.isArray(response.data)) {
        urlData = response.data
      } else if (Array.isArray(response)) {
        urlData = response
      } else if (response.data && Array.isArray(response.data.urls)) {
        urlData = response.data.urls
      } else {
        console.warn("Unexpected API response structure:", response)
        urlData = []
      }

      setUrls(urlData)
    } catch (err) {
      console.error("Failed to fetch URLs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch URLs")
      setUrls([]) // Ensure urls is always an array
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addUrl = useCallback(
    async (url: string) => {
      try {
        setError(null)
        const response = await apiClient.post("/api/urls", { url })

        // Add the new URL to the list immediately
        if (response.data) {
          setUrls((prev) => [response.data, ...prev])
        }

        // Refresh the full list to get updated data
        await fetchUrls()
      } catch (err) {
        console.error("Failed to add URL:", err)
        setError(err instanceof Error ? err.message : "Failed to add URL")
        throw err
      }
    },
    [fetchUrls],
  )

  const deleteUrl = useCallback(async (id: string) => {
    try {
      setError(null)
      await apiClient.delete(`/api/urls/${id}`)

      // Remove from local state immediately
      setUrls((prev) => prev.filter((url) => url.id !== id))
    } catch (err) {
      console.error("Failed to delete URL:", err)
      setError(err instanceof Error ? err.message : "Failed to delete URL")
      throw err
    }
  }, [])

  const deleteUrls = useCallback(async (ids: string[]) => {
    try {
      setError(null)
      await apiClient.delete("/api/urls/bulk", { data: { ids } })

      // Remove from local state immediately
      setUrls((prev) => prev.filter((url) => !ids.includes(url.id)))
    } catch (err) {
      console.error("Failed to delete URLs:", err)
      setError(err instanceof Error ? err.message : "Failed to delete URLs")
      throw err
    }
  }, [])

  const refreshData = useCallback(async () => {
    await fetchUrls()
  }, [fetchUrls])

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data)

        if (message.type === "crawl_update" && message.data) {
          setUrls((prev) => {
            const existingIndex = prev.findIndex((url) => url.id === message.data.id)
            if (existingIndex >= 0) {
              // Update existing URL
              const updated = [...prev]
              updated[existingIndex] = { ...updated[existingIndex], ...message.data }
              return updated
            } else {
              // Add new URL
              return [message.data, ...prev]
            }
          })
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err)
      }
    }
  }, [lastMessage])

  // Initial data fetch
  useEffect(() => {
    fetchUrls()
  }, [fetchUrls])

  return {
    urls,
    isLoading,
    error,
    addUrl,
    deleteUrl,
    deleteUrls,
    refreshData,
  }
}
