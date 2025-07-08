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
}

type SortField = "url" | "title" | "status" | "createdAt" | "internalLinks" | "externalLinks"
type SortDirection = "asc" | "desc"

export function URLTable({ urls, selectedURLs, onSelectionChange, onViewDetails }: URLTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const itemsPerPage = 10

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedURLs = [...urls].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === "createdAt") {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedURLs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedURLs = sortedURLs.slice(startIndex, startIndex + itemsPerPage)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(paginatedURLs.map((url) => url.id))
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
    const variants = {
      queued: "secondary",
      running: "default",
      completed: "default",
      error: "destructive",
    } as const

    const colors = {
      queued: "bg-yellow-100 text-yellow-800",
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Crawled URLs ({urls.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-primary/10 bg-background/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedURLs.length > 0 && paginatedURLs.every((url) => selectedURLs.includes(url.id))}
                    onCheckedChange={handleSelectAll}
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
              {paginatedURLs.map((url) => (
                <TableRow key={url.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedURLs.includes(url.id)}
                      onCheckedChange={(checked) => handleSelectURL(url.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={url.url}>
                      {url.url}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={url.title || "N/A"}>
                      {url.title || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(url.status)}</TableCell>
                  <TableCell>{url.internalLinks || 0}</TableCell>
                  <TableCell>{url.externalLinks || 0}</TableCell>
                  <TableCell>
                    {url.brokenLinks ? (
                      <Badge variant="destructive">{url.brokenLinks.length}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(url.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(url.id)}
                      disabled={url.status !== "completed"}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, urls.length)} of {urls.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
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
