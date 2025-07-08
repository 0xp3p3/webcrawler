"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AddUrlDialog } from "@/components/add-url-dialog"
import { UrlTable } from "@/components/url-table"
import { UrlDetails } from "@/components/url-details"
import { LinkChart } from "@/components/link-chart"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCrawlData } from "@/hooks/use-crawl-data"
import { useWebSocket } from "@/hooks/use-websocket"
import { Plus, Globe, Activity, TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react"
import type { CrawlResult } from "@/types/crawler"

export default function Dashboard() {
  const [selectedUrl, setSelectedUrl] = useState<CrawlResult | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { data: crawlData, loading, error, refetch } = useCrawlData()

  // WebSocket connection for real-time updates
  useWebSocket("ws://localhost:8080/ws", {
    onMessage: (data) => {
      console.log("WebSocket message received:", data)
      refetch() // Refresh data when updates are received
    },
  })

  const stats = {
    total: crawlData?.length || 0,
    completed: crawlData?.filter((item) => item.status === "completed").length || 0,
    failed: crawlData?.filter((item) => item.status === "failed").length || 0,
    crawling: crawlData?.filter((item) => item.status === "crawling").length || 0,
  }

  const handleUrlSelect = (url: CrawlResult) => {
    setSelectedUrl(url)
  }

  const handleAddUrl = () => {
    setIsAddDialogOpen(true)
  }

  const handleUrlAdded = () => {
    refetch()
    setIsAddDialogOpen(false)
  }

  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
          <div className="glass-effect rounded-2xl p-8 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading dashboard...</span>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Web Crawler Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">Monitor and manage your web crawling operations</p>
              </div>
              <Button
                onClick={handleAddUrl}
                className="gradient-bg hover:opacity-90 transition-opacity shadow-lg"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add URL
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-effect border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total URLs</CardTitle>
                  <Globe className="h-5 w-5 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">URLs in your crawler</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground mt-1">Successfully crawled</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                  <Activity className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.crawling}</div>
                  <p className="text-xs text-muted-foreground mt-1">Currently crawling</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                  <XCircle className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
                  <p className="text-xs text-muted-foreground mt-1">Failed attempts</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="urls" className="space-y-6">
              <TabsList className="glass-effect border-0 p-1">
                <TabsTrigger
                  value="urls"
                  className="data-[state=active]:bg-white/50 dark:data-[state=active]:bg-slate-800/50"
                >
                  URLs & Results
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-white/50 dark:data-[state=active]:bg-slate-800/50"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="urls" className="space-y-6">
                <Card className="glass-effect border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Crawled URLs
                    </CardTitle>
                    <CardDescription>View and manage your crawled URLs and their results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UrlTable data={crawlData || []} onRowClick={handleUrlSelect} loading={loading} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card className="glass-effect border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Link Analysis
                    </CardTitle>
                    <CardDescription>Visualize the relationships between crawled pages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LinkChart data={crawlData || []} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Modals */}
            <AddUrlDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onUrlAdded={handleUrlAdded} />

            <UrlDetails url={selectedUrl} open={!!selectedUrl} onOpenChange={(open) => !open && setSelectedUrl(null)} />
          </div>
        </div>
      </AuthGuard>
    </ThemeProvider>
  )
}
