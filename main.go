package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"web-crawler/internal/config"
	"web-crawler/internal/database"
	"web-crawler/internal/handlers"
	"web-crawler/internal/middleware"
	"web-crawler/internal/services"
	"web-crawler/internal/websocket"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize services
	authService := services.NewAuthService(cfg.JWTSecret)
	crawlerService := services.NewCrawlerService(db)
	urlService := services.NewURLService(db, crawlerService)

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, db)
	urlHandler := handlers.NewURLHandler(urlService, wsHub)
	wsHandler := handlers.NewWebSocketHandler(wsHub, authService)

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://your-frontend-domain.com"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// WebSocket endpoint
	router.GET("/ws", wsHandler.HandleWebSocket)

	// API routes
	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(authService), authHandler.Logout)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.GET("/me", middleware.AuthMiddleware(authService), authHandler.GetCurrentUser)
		}

		// Protected URL routes
		urls := api.Group("/urls")
		urls.Use(middleware.AuthMiddleware(authService))
		{
			urls.GET("", urlHandler.ListURLs)
			urls.POST("", urlHandler.CreateURL)
			urls.DELETE("", urlHandler.DeleteURLs)
			urls.GET("/:id", urlHandler.GetURL)
			urls.POST("/:id/start", urlHandler.StartCrawling)
			urls.POST("/:id/stop", urlHandler.StopCrawling)
			urls.POST("/:id/rerun", urlHandler.RerunAnalysis)
		}
	}

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(router.Run(":" + cfg.Port))
}
