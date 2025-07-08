"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Eye, ArrowUpDown, Globe } from "lucide-react"
import type { URLData } from "@/types/crawler"

interface URLTableProps {
  urls: URLData[]
  selectedURLs: string[]
  onSelectionChange: (selected: string[]) => void
  onViewDetails: (urlId: string) => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onSortChange?: (field: string, direction: "asc" | "desc") => void
  loading?: boolean
}

type SortField = "url" | "title" | "status" | "createdAt" | "internalLinks" | "externalLinks"
type SortDirection = "asc" | "desc"

export function URLTable({
  urls,
  selectedURLs,
  onSelectionChange,
  onViewDetails,
  pagination,
  onPageChange,
  onSortChange,
  loading = false,
}: URLTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  console.log(urls, selectedURLs, pagination)
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = "asc"

    if (sortField === field) {
      newDirection = sortDirection === "asc" ? "desc" : "asc"
    } else {
      newDirection = "asc"
    }

    setSortField(field)
    setSortDirection(newDirection)

    // Call the parent component's sort handler for server-side sorting
    if (onSortChange) {
      onSortChange(field, newDirection)
    }
  }

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    }
  }

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

  const getStatusBadge = (status: URLData["status"]) => {
    const statusConfig = {
      queued: {
        variant: "secondary" as const,
        className: "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200",
        text: "Queued",
      },
      running: {
        variant: "default" as const,
        className: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200 animate-pulse",
        text: "Running",
      },
      completed: {
        variant: "default" as const,
        className: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200",
        text: "Completed",
      },
      error: {
        variant: "destructive" as const,
        className: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200",
        text: "Error",
      },
    }

    const config = statusConfig[status]

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    )
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(field)}
        className={`h-auto p-0 font-medium hover:text-primary transition-colors ${isActive ? "text-primary" : ""}`}
      >
        {children}
        <ArrowUpDown className={`ml-2 h-4 w-4 ${isActive ? "text-primary" : ""}`} />
      </Button>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid Date"
    }
  }

  const currentPage = pagination?.page || 1
  const totalPages = pagination?.totalPages || 1
  const total = pagination?.total || urls.length
  const limit = pagination?.limit || 10
  const startIndex = (currentPage - 1) * limit + 1
  const endIndex = Math.min(currentPage * limit, total)

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Crawled URLs ({total})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-primary/10 bg-background/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={urls.length > 0 && urls.every((url) => selectedURLs.includes(url.id))}
                    onCheckedChange={handleSelectAll}
                    disabled={loading}
                  />
                </TableHead>
                <TableHead>
                  <SortButton field="url">URL</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="title">Title</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="status">Status</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="internalLinks">Internal Links</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="externalLinks">External Links</SortButton>
                </TableHead>
                <TableHead>Broken Links</TableHead>
                <TableHead>
                  <SortButton field="createdAt">Created</SortButton>
                </TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell>
                      <div className="w-4 h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-32 h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24 h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-6 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-8 h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-8 h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-8 h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-20 h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : urls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No URLs found. Add some URLs to get started.
                  </TableCell>
                </TableRow>
              ) : (
                urls.map((url) => (
                  <TableRow key={url.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedURLs.includes(url.id)}
                        onCheckedChange={(checked) => handleSelectURL(url.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={url.url}>
                        <span className="text-sm font-mono">{url.url}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={url.title || "N/A"}>
                        {url.title || <span className="text-muted-foreground italic">No title</span>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(url.status)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{url.internalLinks || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{url.externalLinks || 0}</span>
                    </TableCell>
                    <TableCell>
                      {url.brokenLinks && url.brokenLinks.length > 0 ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          {url.brokenLinks.length}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(url.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(url.id)}
                        disabled={url.status !== "completed"}
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-primary/10 bg-gradient-to-r from-primary/5 to-purple-600/5">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex} to {endIndex} of {total} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
