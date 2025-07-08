"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { CrawlURL, PaginationInfo } from "@/types/crawler"

interface URLTableProps {
  urls: CrawlURL[]
  selectedURLs: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onViewDetails: (urlId: string) => void
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
  onSortChange?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  loading?: boolean
}

export function URLTable({
  urls,
  selectedURLs,
  onSelectionChange,
  onViewDetails,
  pagination,
  onPageChange,
  onSortChange,
  sortField = "created_at",
  sortDirection = "desc",
  loading = false,
}: URLTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(urls.map((url) => url.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectURL = (urlId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedURLs, urlId])
    } else {
      onSelectionChange(selectedURLs.filter((id) => id !== urlId))
    }
  }

  const handleSort = (field: string) => {
    if (!onSortChange) return

    let newDirection: "asc" | "desc" = "asc"
    if (sortField === field && sortDirection === "asc") {
      newDirection = "desc"
    }
    onSortChange(field, newDirection)
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-primary" />
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      queued: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      running: { variant: "default" as const, className: "bg-blue-100 text-blue-800 border-blue-300 animate-pulse" },
      completed: { variant: "default" as const, className: "bg-green-100 text-green-800 border-green-300" },
      error: { variant: "destructive" as const, className: "bg-red-100 text-red-800 border-red-300" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued

    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  const isAllSelected = urls.length > 0 && selectedURLs.length === urls.length
  const isIndeterminate = selectedURLs.length > 0 && selectedURLs.length < urls.length

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>URLs ({pagination?.total || urls.length})</span>
          {pagination && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/30">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all URLs"
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    {...(isIndeterminate && { "data-state": "indeterminate" })}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("url")}
                    className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
                  >
                    URL
                    {getSortIcon("url")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("title")}
                    className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
                  >
                    Title
                    {getSortIcon("title")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("status")}
                    className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
                  >
                    Status
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("created_at")}
                    className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
                  >
                    Created
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("updated_at")}
                    className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
                  >
                    Updated
                    {getSortIcon("updated_at")}
                  </Button>
                </TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : urls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No URLs found. Add a URL to get started.
                  </TableCell>
                </TableRow>
              ) : (
                urls.map((url) => (
                  <TableRow key={url.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedURLs.includes(url.id)}
                        onCheckedChange={(checked) => handleSelectURL(url.id, checked as boolean)}
                        aria-label={`Select ${url.url}`}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate font-medium text-foreground" title={url.url}>
                        {url.url}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-muted-foreground" title={url.title || "No title"}>
                        {url.title || "No title"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(url.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(url.created_at)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(url.updated_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(url.id)}
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors bg-transparent"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.page - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange?.(pageNum)}
                      className={
                        pagination.page === pageNum
                          ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                          : "hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors bg-transparent"
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors bg-transparent"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
