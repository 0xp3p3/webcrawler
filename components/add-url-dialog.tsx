"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Plus, Globe, Settings, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface AddUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUrlAdded: () => void
}

export function AddUrlDialog({ open, onOpenChange, onUrlAdded }: AddUrlDialogProps) {
  const [url, setUrl] = useState("")
  const [depth, setDepth] = useState(1)
  const [followExternal, setFollowExternal] = useState(false)
  const [respectRobots, setRespectRobots] = useState(true)
  const [delay, setDelay] = useState(1000)
  const [userAgent, setUserAgent] = useState("WebCrawler/1.0")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to crawl.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (including http:// or https://).",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await apiClient.post("/urls", {
        url: url.trim(),
        depth,
        follow_external: followExternal,
        respect_robots: respectRobots,
        delay,
        user_agent: userAgent,
      })

      toast({
        title: "URL Added Successfully",
        description: "The URL has been added to the crawl queue.",
      })

      // Reset form
      setUrl("")
      setDepth(1)
      setFollowExternal(false)
      setRespectRobots(true)
      setDelay(1000)
      setUserAgent("WebCrawler/1.0")

      onUrlAdded()
    } catch (error) {
      console.error("Error adding URL:", error)
      toast({
        title: "Error Adding URL",
        description: "Failed to add the URL. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-effect border-0">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            Add New URL
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure crawling settings for your new URL. The crawler will start processing immediately after
            submission.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <Card className="glass-effect border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Target URL
              </CardTitle>
              <CardDescription>Enter the URL you want to crawl</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium">
                  URL *
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="glass-effect border-0"
                  required
                />
                <p className="text-xs text-muted-foreground">Make sure to include the protocol (http:// or https://)</p>
              </div>
            </CardContent>
          </Card>

          {/* Crawling Settings */}
          <Card className="glass-effect border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Crawling Settings
              </CardTitle>
              <CardDescription>Configure how the crawler should behave</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Depth Setting */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="depth" className="text-sm font-medium">
                    Crawl Depth
                  </Label>
                  <Badge variant="outline" className="font-mono">
                    {depth} {depth === 1 ? "level" : "levels"}
                  </Badge>
                </div>
                <Input
                  id="depth"
                  type="number"
                  min="1"
                  max="5"
                  value={depth}
                  onChange={(e) => setDepth(Number.parseInt(e.target.value) || 1)}
                  className="glass-effect border-0"
                />
                <p className="text-xs text-muted-foreground">
                  How many levels deep to crawl (1-5). Higher values take longer.
                </p>
              </div>

              <Separator />

              {/* Delay Setting */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delay" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Request Delay
                  </Label>
                  <Badge variant="outline" className="font-mono">
                    {delay}ms
                  </Badge>
                </div>
                <Input
                  id="delay"
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={delay}
                  onChange={(e) => setDelay(Number.parseInt(e.target.value) || 1000)}
                  className="glass-effect border-0"
                />
                <p className="text-xs text-muted-foreground">
                  Delay between requests in milliseconds. Higher values are more respectful to servers.
                </p>
              </div>

              <Separator />

              {/* Boolean Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Follow External Links</Label>
                    <p className="text-xs text-muted-foreground">Crawl links that point to other domains</p>
                  </div>
                  <Switch checked={followExternal} onCheckedChange={setFollowExternal} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Respect robots.txt
                    </Label>
                    <p className="text-xs text-muted-foreground">Follow robots.txt rules (recommended)</p>
                  </div>
                  <Switch checked={respectRobots} onCheckedChange={setRespectRobots} />
                </div>
              </div>

              <Separator />

              {/* User Agent */}
              <div className="space-y-3">
                <Label htmlFor="userAgent" className="text-sm font-medium">
                  User Agent
                </Label>
                <Input
                  id="userAgent"
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  className="glass-effect border-0"
                  placeholder="WebCrawler/1.0"
                />
                <p className="text-xs text-muted-foreground">How the crawler identifies itself to websites</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="glass-effect border-0 bg-primary/5 dark:bg-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Crawl Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Target:</span>
                  <p className="font-medium truncate" title={url || "No URL entered"}>
                    {url || "No URL entered"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Depth:</span>
                  <p className="font-medium">
                    {depth} level{depth !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">External Links:</span>
                  <p className="font-medium">{followExternal ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Delay:</span>
                  <p className="font-medium">{delay}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="glass-effect border-0"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="gradient-bg hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding URL...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Crawling
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
