package config

import (
	"os"
)

type Config struct {
	Port        string
	Environment string
	DatabaseURL string
	JWTSecret   string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),
		DatabaseURL: getEnv("DATABASE_URL", "root:@tcp(localhost:3306)/webcrawler?charset=utf8mb4&parseTime=True&loc=Local"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
