"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Download, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { UrlTable } from "@/components/url-table"
import { UrlDetails } from "@/components/url-details"
import {AddURLDialog } from "@/components/add-url-dialog"
import { AuthGuard } from "@/components/auth-guard"
import { useCrawlData } from "@/hooks/use-crawl-data"
import { useWebSocket } from "@/hooks/use-websocket"
import type { CrawlResult } from "@/types/crawler"

function DashboardContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [selectedUrl, setSelectedUrl] = useState<CrawlResult | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const { urls, isLoading, error, addUrl, deleteUrl, deleteUrls, refreshData } = useCrawlData()
  const { connectionStatus } = useWebSocket()

  // Ensure urls is always an array before filtering
  const safeUrls = Array.isArray(urls) ? urls : []

  const filteredURLs = useMemo(() => {
    if (!searchQuery.trim()) return safeUrls

    return safeUrls.filter(
      (url) =>
        url.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        url.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        url.status?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [safeUrls, searchQuery])

  const stats = useMemo(() => {
    const total = safeUrls.length
    const crawled = safeUrls.filter((url) => url.status === "completed").length
    const pending = safeUrls.filter((url) => url.status === "pending").length
    const failed = safeUrls.filter((url) => url.status === "failed").length

    return { total, crawled, pending, failed }
  }, [safeUrls])

  const handleAddUrl = async (url: string) => {
    try {
      await addUrl(url)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add URL:", error)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedUrls.length === 0) return

    try {
      await deleteUrls(selectedUrls)
      setSelectedUrls([])
    } catch (error) {
      console.error("Failed to delete URLs:", error)
    }
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredURLs, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `crawl-data-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (isLoading && safeUrls.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Crawler Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your web crawling operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === "Connected" ? "default" : "destructive"}>{connectionStatus}</Badge>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add URL
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">URLs in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crawled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.crawled}</div>
            <p className="text-xs text-muted-foreground">Successfully crawled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Waiting to be crawled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed to crawl</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="table" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="details">Details View</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
            <Button variant="outline" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {selectedUrls.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedUrls.length})
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="table" className="space-y-4">
          <UrlTable
            urls={filteredURLs}
            selectedUrls={selectedUrls}
            onSelectionChange={setSelectedUrls}
            onUrlSelect={setSelectedUrl}
            onDeleteUrl={deleteUrl}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedUrl ? (
            <UrlDetails url={selectedUrl} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>URL Details</CardTitle>
                <CardDescription>Select a URL from the table to view detailed information</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add URL Dialog */}
      <AddURLDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddUrl={handleAddUrl} />
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
