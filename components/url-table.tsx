"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, Search, CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink, Calendar } from "lucide-react"
import type { CrawlResult } from "@/types/crawler"

interface UrlTableProps {
  data: CrawlResult[]
  onRowClick: (url: CrawlResult) => void
  loading?: boolean
}

export function UrlTable({ data, onRowClick, loading }: UrlTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card className="glass-effect border-0">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading URLs...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search URLs or titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-effect border-0"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={statusFilter === "all" ? "gradient-bg" : "glass-effect border-0"}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className={statusFilter === "completed" ? "gradient-bg" : "glass-effect border-0"}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === "crawling" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("crawling")}
            className={statusFilter === "crawling" ? "gradient-bg" : "glass-effect border-0"}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("failed")}
            className={statusFilter === "failed" ? "gradient-bg" : "glass-effect border-0"}
          >
            Failed
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredData.length} of {data.length} URLs
        </span>
        {searchTerm && <span>Filtered by: "{searchTerm}"</span>}
      </div>

      {/* Table */}
      <Card className="glass-effect border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-muted/30">
              <TableHead className="font-semibold">URL</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Links</TableHead>
              <TableHead className="font-semibold">Crawled</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Globe className="h-12 w-12 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <p className="text-lg font-medium text-muted-foreground">
                        {searchTerm ? "No matching URLs found" : "No URLs crawled yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? "Try adjusting your search terms" : "Add a URL to get started"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors border-border/50"
                  onClick={() => onRowClick(item)}
                >
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate font-medium" title={item.url}>
                        {item.url}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="truncate" title={item.title || "No title"}>
                      {item.title || "No title"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {item.links?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.crawled_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRowClick(item)
                      }}
                      className="hover:bg-primary/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
