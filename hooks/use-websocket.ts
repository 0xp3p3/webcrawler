"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { WebSocketMessage } from "@/types/crawler"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws"

export function useWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      setConnectionStatus("connecting")
      setError(null)

      // Get auth token from localStorage
      const token = localStorage.getItem("auth_token")
      const wsUrl = token ? `${WS_URL}?token=${token}` : WS_URL

      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log("WebSocket connected")
        setConnectionStatus("connected")
        reconnectAttempts.current = 0
        setError(null)
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
        } catch (err) {
          console.error("Error parsing WebSocket message:", err)
        }
      }

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason)
        setConnectionStatus("disconnected")

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (error) => {
        console.log("WebSocket error:", error)
        setError("WebSocket connection error")
        setConnectionStatus("disconnected")
      }
    } catch (err) {
      console.error("Error creating WebSocket connection:", err)
      setError("Failed to create WebSocket connection")
      setConnectionStatus("disconnected")
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (ws.current) {
      ws.current.close(1000, "Manual disconnect")
      ws.current = null
    }

    setConnectionStatus("disconnected")
    reconnectAttempts.current = 0
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket is not connected")
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
  }
}
