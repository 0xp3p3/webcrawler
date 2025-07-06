export interface URLData {
  id: string
  url: string
  title: string | null
  status: "queued" | "running" | "completed" | "error"
  htmlVersion: string | null
  headingTags: Record<string, number> | null
  internalLinks: number | null
  externalLinks: number | null
  brokenLinks: BrokenLink[] | null
  hasLoginForm: boolean | null
  createdAt: string
  updatedAt: string | null
  analysisDuration: number | null
}

export interface BrokenLink {
  url: string
  statusCode: number
  error: string
}

export interface WebSocketMessage {
  type: "status_update" | "error" | "progress" | "crawl_started" | "crawl_completed"
  url?: string
  status?: URLData["status"]
  data?: Partial<URLData>
  error?: string
  progress?: number
  message?: string
  timestamp?: string
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: "asc" | "desc"
  search?: string
}

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
