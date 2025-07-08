"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, RefreshCw, Search, LogOut, Activity, Globe, AlertCircle, CheckCircle } from "lucide-react"
import { URLTable } from "@/components/url-table"
import { URLDetails } from "@/components/url-details"
import { AddURLDialog } from "@/components/add-url-dialog"
import { AuthGuard } from "@/components/auth-guard"
import { useWebSocket } from "@/hooks/use-websocket"
import { useCrawlData } from "@/hooks/use-crawl-data"
import { useAuth } from "@/hooks/use-auth"
import type { WebSocketMessage } from "@/types/crawler"

function DashboardContent() {
  const [selectedURLs, setSelectedURLs] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedURL, setSelectedURL] = useState<string | null>(null)

  const { user, logout } = useAuth()
  const { urls, loading, error, addURL, updateURLStatus, deleteURLs, rerunAnalysis } = useCrawlData()
  const { connectionStatus, lastMessage, error: wsError, addMessageHandler } = useWebSocket()

  // Reliable message handler using the new queue system
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log("Processing WebSocket message:", message)

      if (message.type && message.url && message.status) {
        console.log("Updating URL status:", {
          url: message.url,
          status: message.status,
          data: message.data,
        })

        updateURLStatus(message.url, message.status, message.data)
      } else {
        console.warn("Invalid message format:", message)
      }
    },
    [updateURLStatus],
  )

  // Register the message handler
  useEffect(() => {
    const cleanup = addMessageHandler(handleWebSocketMessage)
    return cleanup
  }, [addMessageHandler, handleWebSocketMessage])

  // Fallback: Handle real-time updates from WebSocket (backward compatibility)
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type && lastMessage.url && lastMessage.status) {
        console.log("Fallback LastMessage processing:", lastMessage)
        updateURLStatus(lastMessage.url, lastMessage.status, lastMessage.data)
      }
    }
  }, [lastMessage, updateURLStatus])

  const handleAddURL = async (url: string) => {
    try {
      await addURL(url)
      setShowAddDialog(false)
    } catch (error) {
      console.error("Failed to add URL:", error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await deleteURLs(selectedURLs)
      setSelectedURLs([])
    } catch (error) {
      console.error("Failed to delete URLs:", error)
    }
  }

  const handleBulkRerun = async () => {
    try {
      await Promise.all(selectedURLs.map((urlId) => rerunAnalysis(urlId)))
      setSelectedURLs([])
    } catch (error) {
      console.error("Failed to rerun analysis:", error)
    }
  }

  const filteredURLs = (Array.isArray(urls) ? urls : []).filter(
    (url) =>
      url.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const statusCounts = {
    queued: (Array.isArray(urls) ? urls : []).filter((u) => u.status === "queued").length,
    running: (Array.isArray(urls) ? urls : []).filter((u) => u.status === "running").length,
    completed: (Array.isArray(urls) ? urls : []).filter((u) => u.status === "completed").length,
    error: (Array.isArray(urls) ? urls : []).filter((u) => u.status === "error").length,
  }

  if (selectedURL) {
    const urlData = (Array.isArray(urls) ? urls : []).find((u) => u.id === selectedURL)
    if (urlData) {
      return <URLDetails urlData={urlData} onBack={() => setSelectedURL(null)} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-purple-600 animate-pulse"></div>
          <p className="text-muted-foreground text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Web Crawler Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">Monitor and analyze website crawling results in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 backdrop-blur-sm border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium">Welcome, {user?.username}</span>
            </div>
            <Badge
              variant={connectionStatus === "connected" ? "default" : "destructive"}
              className={
                connectionStatus === "connected"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  : "bg-gradient-to-r from-red-500 to-rose-600"
              }
            >
              <Activity className="w-3 h-3 mr-1" />
              WebSocket: {connectionStatus}
            </Badge>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add URL
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Alerts */}
        {error && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">API Error: {error}</AlertDescription>
          </Alert>
        )}

        {wsError && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">WebSocket Error: {wsError}</AlertDescription>
          </Alert>
        )}

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"></div>
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Queued
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-yellow-600">{statusCounts.queued}</div>
              <p className="text-xs text-muted-foreground mt-1">Waiting to process</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                Running
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-blue-600">{statusCounts.running}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently processing</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-600">{statusCounts.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully analyzed</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5"></div>
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-red-600">{statusCounts.error}</div>
              <p className="text-xs text-muted-foreground mt-1">Failed to process</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              URL Management
            </CardTitle>
            <CardDescription>Search, filter, and manage your crawled URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search URLs or titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBulkRerun}
                  disabled={selectedURLs.length === 0}
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors bg-transparent"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rerun ({selectedURLs.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={selectedURLs.length === 0}
                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedURLs.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* URL Table */}
        <URLTable
          urls={filteredURLs}
          selectedURLs={selectedURLs}
          onSelectionChange={setSelectedURLs}
          onViewDetails={setSelectedURL}
        />

        {/* Add URL Dialog */}
        <AddURLDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAddURL={handleAddURL} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
