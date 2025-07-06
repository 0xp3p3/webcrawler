// Environment variables configuration
export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const

// Validate required environment variables
export function validateEnv() {
  const required = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WS_URL"]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0 && env.NODE_ENV === "production") {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
  }
}
