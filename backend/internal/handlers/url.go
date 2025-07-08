package handlers

import (
	"net/http"
	"strconv"

	"web-crawler/internal/models"
	"web-crawler/internal/services"
	"web-crawler/internal/websocket"

	"github.com/gin-gonic/gin"
)

type URLHandler struct {
	urlService *services.URLService
	wsHub      *websocket.Hub
}

func NewURLHandler(urlService *services.URLService, wsHub *websocket.Hub) *URLHandler {
	return &URLHandler{
		urlService: urlService,
		wsHub:      wsHub,
	}
}

func (h *URLHandler) CreateURL(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.CreateURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	urlData, err := h.urlService.CreateURL(userID.(string), req.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create URL"})
		return
	}

	// Notify via WebSocket
	h.wsHub.Broadcast <- &models.WebSocketMessage{
		Type:   "status_update",
		URL:    urlData.URL,
		Status: urlData.Status,
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    urlData,
	})
}

func (h *URLHandler) ListURLs(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	sort := c.DefaultQuery("sort", "created_at")
	order := c.DefaultQuery("order", "DESC")

	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	urls, total, err := h.urlService.GetURLs(userID.(string), page, limit, sort, order, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URLs"})
		return
	}

	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"data": urls,
			"pagination": gin.H{
				"page":       page,
				"limit":      limit,
				"total":      total,
				"totalPages": totalPages,
			},
		},
	})
}

func (h *URLHandler) GetURL(c *gin.Context) {
	userID, _ := c.Get("user_id")
	urlID := c.Param("id")

	urlData, err := h.urlService.GetURL(userID.(string), urlID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    urlData,
	})
}

func (h *URLHandler) DeleteURLs(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.DeleteURLsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.urlService.DeleteURLs(userID.(string), req.IDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URLs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "URLs deleted successfully",
	})
}

func (h *URLHandler) StartCrawling(c *gin.Context) {
	userID, _ := c.Get("user_id")
	urlID := c.Param("id")

	err := h.urlService.StartCrawling(userID.(string), urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start crawling"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Crawling started",
	})
}

func (h *URLHandler) StopCrawling(c *gin.Context) {
	userID, _ := c.Get("user_id")
	urlID := c.Param("id")

	err := h.urlService.StopCrawling(userID.(string), urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop crawling"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Crawling stopped",
	})
}

func (h *URLHandler) RerunAnalysis(c *gin.Context) {
	userID, _ := c.Get("user_id")
	urlID := c.Param("id")

	err := h.urlService.RerunAnalysis(userID.(string), urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rerun analysis"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Analysis restarted",
	})
}
