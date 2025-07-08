"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Globe,
  Clock,
  LinkIcon,
  FileText,
  ImageIcon,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import type { CrawlResult } from "@/types/crawler"

interface UrlDetailsProps {
  url: CrawlResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UrlDetails({ url, open, onOpenChange }: UrlDetailsProps) {
  if (!url) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "crawling":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="status-indicator status-success">Completed</Badge>
      case "failed":
        return <Badge className="status-indicator status-error">Failed</Badge>
      case "crawling":
        return <Badge className="status-indicator status-crawling">Crawling</Badge>
      default:
        return <Badge className="status-indicator status-pending">Pending</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-effect border-0">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                URL Details
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{url.url}</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </div>
            </div>
            {getStatusBadge(url.status)}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 glass-effect border-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-effect border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(url.status)}
                      Status Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      {getStatusBadge(url.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Response Code:</span>
                      <Badge variant={url.status_code === 200 ? "default" : "destructive"}>
                        {url.status_code || "N/A"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Crawled At:</span>
                      <span className="text-sm font-medium">
                        {url.crawled_at ? new Date(url.crawled_at).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Content Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Title:</span>
                      <span className="text-sm font-medium truncate max-w-[200px]" title={url.title}>
                        {url.title || "No title"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Links Found:</span>
                      <Badge variant="outline">{url.links?.length || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Images Found:</span>
                      <Badge variant="outline">{url.images?.length || 0}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {url.error && (
                <Card className="glass-effect border-0 border-red-200 dark:border-red-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      Error Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {url.error}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Page Content
                  </CardTitle>
                  <CardDescription>Extracted content from the crawled page</CardDescription>
                </CardHeader>
                <CardContent>
                  {url.content ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Page Title</h4>
                        <p className="text-sm bg-muted p-3 rounded-lg">{url.title || "No title found"}</p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Content Preview</h4>
                        <ScrollArea className="h-40 bg-muted p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {url.content.substring(0, 1000)}
                            {url.content.length > 1000 && "..."}
                          </p>
                        </ScrollArea>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No content available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Found Links ({url.links?.length || 0})
                  </CardTitle>
                  <CardDescription>All links discovered on this page</CardDescription>
                </CardHeader>
                <CardContent>
                  {url.links && url.links.length > 0 ? (
                    <ScrollArea className="h-60">
                      <div className="space-y-2">
                        {url.links.map((link, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate flex-1" title={link}>
                              {link}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No links found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Images ({url.images?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {url.images && url.images.length > 0 ? (
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {url.images.map((image, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate flex-1" title={image}>
                              {image}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No images found</p>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm font-medium">
                      {url.created_at ? new Date(url.created_at).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Updated:</span>
                    <span className="text-sm font-medium">
                      {url.updated_at ? new Date(url.updated_at).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Crawled:</span>
                    <span className="text-sm font-medium">
                      {url.crawled_at ? new Date(url.crawled_at).toLocaleString() : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
