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

interface AddURLDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddURL: (url: string) => void
}

export function AddURLDialog({ open, onOpenChange, onAddURL }: AddURLDialogProps) {
  const [url, setUrl] = useState("")
  const [isValid, setIsValid] = useState(true)

  const validateURL = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setIsValid(false)
      return
    }

    const isValidURL = validateURL(url)
    setIsValid(isValidURL)

    if (isValidURL) {
      onAddURL(url)
      setUrl("")
      setIsValid(true)
    }
  }

  const handleURLChange = (value: string) => {
    setUrl(value)
    if (!isValid && value.trim()) {
      setIsValid(validateURL(value))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add URL for Analysis</DialogTitle>
          <DialogDescription>
            Enter a URL to crawl and analyze. The system will extract page information and analyze links.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => handleURLChange(e.target.value)}
                className={!isValid ? "border-red-500" : ""}
              />
              {!isValid && <p className="text-sm text-red-500 mt-1">Please enter a valid URL</p>}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add URL</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
