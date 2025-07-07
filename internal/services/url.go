package services

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"web-crawler/internal/models"
	"web-crawler/internal/websocket"

	"github.com/google/uuid"
)

type URLService struct {
	db      *sql.DB
	crawler *CrawlerService
	hub     *websocket.Hub
}

func NewURLService(db *sql.DB, crawler *CrawlerService, hub *websocket.Hub) *URLService {
	return &URLService{
		db:      db,
		crawler: crawler,
		hub:     hub,
	}
}

func (s *URLService) CreateURL(userID, url string) (*models.URLData, error) {
	urlData := &models.URLData{
		ID:        uuid.New().String(),
		UserID:    userID,
		URL:       url,
		Status:    "queued",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `INSERT INTO urls (id, user_id, url, status, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?)`

	_, err := s.db.Exec(query, urlData.ID, urlData.UserID, urlData.URL,
		urlData.Status, urlData.CreatedAt, urlData.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return urlData, nil
}

func (s *URLService) GetURLs(userID string, page, limit int, search string) ([]*models.URLData, int, error) {
	offset := (page - 1) * limit

	// Build query with search
	whereClause := "WHERE user_id = ?"
	args := []interface{}{userID}

	if search != "" {
		whereClause += " AND (url LIKE ? OR title LIKE ?)"
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern)
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM urls " + whereClause
	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get URLs with pagination
	query := fmt.Sprintf(`SELECT id, user_id, url, title, status, html_version, heading_tags,
						  internal_links, external_links, broken_links, has_login_form,
						  error_message, analysis_duration, created_at, updated_at
						  FROM urls %s ORDER BY created_at DESC LIMIT ? OFFSET ?`, whereClause)

	args = append(args, limit, offset)
	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var urls []*models.URLData
	for rows.Next() {
		url := &models.URLData{}
		err := rows.Scan(
			&url.ID, &url.UserID, &url.URL, &url.Title, &url.Status,
			&url.HTMLVersion, &url.HeadingTags, &url.InternalLinks,
			&url.ExternalLinks, &url.BrokenLinks, &url.HasLoginForm,
			&url.ErrorMessage, &url.AnalysisDuration, &url.CreatedAt, &url.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		urls = append(urls, url)
	}

	return urls, total, nil
}

func (s *URLService) GetURL(userID, urlID string) (*models.URLData, error) {
	url := &models.URLData{}
	query := `SELECT id, user_id, url, title, status, html_version, heading_tags,
			  internal_links, external_links, broken_links, has_login_form,
			  error_message, analysis_duration, created_at, updated_at
			  FROM urls WHERE id = ? AND user_id = ?`

	err := s.db.QueryRow(query, urlID, userID).Scan(
		&url.ID, &url.UserID, &url.URL, &url.Title, &url.Status,
		&url.HTMLVersion, &url.HeadingTags, &url.InternalLinks,
		&url.ExternalLinks, &url.BrokenLinks, &url.HasLoginForm,
		&url.ErrorMessage, &url.AnalysisDuration, &url.CreatedAt, &url.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return url, nil
}

func (s *URLService) DeleteURLs(userID string, urlIDs []string) error {
	if len(urlIDs) == 0 {
		return nil
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(urlIDs))
	args := []interface{}{userID}

	for i, id := range urlIDs {
		placeholders[i] = "?"
		args = append(args, id)
	}

	query := fmt.Sprintf("DELETE FROM urls WHERE user_id = ? AND id IN (%s)",
		fmt.Sprintf(strings.Join(placeholders, ",")))

	_, err := s.db.Exec(query, args...)
	return err
}

func (s *URLService) StartCrawling(userID, urlID string) error {
	// Update status to running
	_, err := s.db.Exec("UPDATE urls SET status = 'running', updated_at = ? WHERE id = ? AND user_id = ?",
		time.Now(), urlID, userID)
	if err != nil {
		return err
	}

	// Start crawling in goroutine
	go s.performCrawl(urlID)

	return nil
}

func (s *URLService) StopCrawling(userID, urlID string) error {
	// Update status to queued (simplified - in production you'd need proper cancellation)
	_, err := s.db.Exec("UPDATE urls SET status = 'queued', updated_at = ? WHERE id = ? AND user_id = ?",
		time.Now(), urlID, userID)
	return err
}

func (s *URLService) RerunAnalysis(userID, urlID string) error {
	// Reset URL status and clear previous results
	query := `UPDATE urls SET status = 'queued', title = NULL, html_version = NULL,
			  heading_tags = NULL, internal_links = NULL, external_links = NULL,
			  broken_links = NULL, has_login_form = NULL, error_message = NULL,
			  analysis_duration = NULL, updated_at = ? WHERE id = ? AND user_id = ?`

	_, err := s.db.Exec(query, time.Now(), urlID, userID)
	if err != nil {
		return err
	}

	// Start crawling
	go s.performCrawl(urlID)

	return nil
}

func (s *URLService) performCrawl(urlID string) {
	// Get URL data
	var url, userID string
	err := s.db.QueryRow("SELECT url, user_id FROM urls WHERE id = ?", urlID).Scan(&url, &userID)
	if err != nil {
		return
	}

	// Broadcast crawling started
	s.hub.BroadcastToUser(userID, &models.WebSocketMessage{
		Type:      "crawl_started",
		URL:       url,
		Status:    "running",
		Message:   "Starting to crawl URL",
		Timestamp: time.Now(),
	})

	// Perform crawling
	result, err := s.crawler.CrawlURL(url)
	if err != nil {
		// Broadcast error
		s.hub.BroadcastToUser(userID, &models.WebSocketMessage{
			Type:      "crawl_error",
			URL:       url,
			Status:    "error",
			Error:     err.Error(),
			Message:   "Crawling failed",
			Timestamp: time.Now(),
		})
		
		s.crawler.UpdateURLStatus(urlID, "error", nil, err.Error())
		return
	}

	// Broadcast success
	s.hub.BroadcastToUser(userID, &models.WebSocketMessage{
		Type:      "crawl_completed",
		URL:       url,
		Status:    "completed",
		Data:      result,
		Message:   "Crawling completed successfully",
		Timestamp: time.Now(),
	})

	// Update with results
	s.crawler.UpdateURLStatus(urlID, "completed", result, "")
}
