"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react"
import type { URLData } from "@/types/crawler"
import { LinkChart } from "@/components/link-chart"

interface URLDetailsProps {
  urlData: URLData
  onBack: () => void
}

export function URLDetails({ urlData, onBack }: URLDetailsProps) {
  const chartData = [
    { name: "Internal Links", value: urlData.internalLinks || 0, color: "#3b82f6" },
    { name: "External Links", value: urlData.externalLinks || 0, color: "#10b981" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">URL Analysis Details</h1>
            <p className="text-muted-foreground truncate max-w-2xl">{urlData.url}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Page Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-lg">{urlData.title || "No title found"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">HTML Version</label>
                <p>{urlData.htmlVersion || "Not detected"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={urlData.status === "completed" ? "default" : "destructive"}>{urlData.status}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Login Form Detected</label>
                <div className="flex items-center gap-2 mt-1">
                  {urlData.hasLoginForm ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Yes</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>No</span>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Heading Tags</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                  {urlData.headingTags &&
                    Object.entries(urlData.headingTags).map(([tag, count]) => (
                      <div key={tag} className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground">{tag.toUpperCase()}</div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link Analysis Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Link Analysis</CardTitle>
              <CardDescription>Distribution of internal vs external links</CardDescription>
            </CardHeader>
            <CardContent>
              <LinkChart data={chartData} />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Internal Links</span>
                  <span className="font-medium">{urlData.internalLinks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">External Links</span>
                  <span className="font-medium">{urlData.externalLinks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Links</span>
                  <span className="font-medium">{(urlData.internalLinks || 0) + (urlData.externalLinks || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Broken Links */}
        {urlData.brokenLinks && urlData.brokenLinks.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Broken Links ({urlData.brokenLinks.length})
              </CardTitle>
              <CardDescription>Links that returned 4xx or 5xx status codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {urlData.brokenLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.url}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {link.statusCode} - {link.error}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Metadata */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Analysis Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p>{new Date(urlData.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p>{urlData.updatedAt ? new Date(urlData.updatedAt).toLocaleString() : "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Analysis Duration</label>
                <p>{urlData.analysisDuration ? `${urlData.analysisDuration}ms` : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
