"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, RefreshCw, Search, LogOut } from "lucide-react"
import { URLTable } from "@/components/url-table"
import { URLDetails } from "@/components/url-details"
import { AddURLDialog } from "@/components/add-url-dialog"
import { AuthGuard } from "@/components/auth-guard"
import { useWebSocket } from "@/hooks/use-websocket"
import { useCrawlData } from "@/hooks/use-crawl-data"
import { useAuth } from "@/hooks/use-auth"

function DashboardContent() {
  const [selectedURLs, setSelectedURLs] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedURL, setSelectedURL] = useState<string | null>(null)

  const { user, logout } = useAuth()
  const { urls, loading, error, addURL, updateURLStatus, deleteURLs, rerunAnalysis } = useCrawlData()
  const { connectionStatus, lastMessage, error: wsError } = useWebSocket()

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type && lastMessage.url && lastMessage.status) {
        console.log("LastMessage:", lastMessage)
        updateURLStatus(lastMessage.url, lastMessage.status, lastMessage.data)
      }
    }
  }, [lastMessage])

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Web Crawler Dashboard</h1>
            <p className="text-muted-foreground">Monitor and analyze website crawling results in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {user?.username}</span>
            <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
              WebSocket: {connectionStatus}
            </Badge>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add URL
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>API Error: {error}</AlertDescription>
          </Alert>
        )}

        {wsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>WebSocket Error: {wsError}</AlertDescription>
          </Alert>
        )}

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Queued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.queued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statusCounts.running}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statusCounts.error}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>URL Management</CardTitle>
            <CardDescription>Search, filter, and manage your crawled URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search URLs or titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBulkRerun} disabled={selectedURLs.length === 0}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rerun ({selectedURLs.length})
                </Button>
                <Button variant="outline" onClick={handleBulkDelete} disabled={selectedURLs.length === 0}>
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
