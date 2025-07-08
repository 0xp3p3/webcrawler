package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         string    `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type URLData struct {
	ID               string          `json:"id" db:"id"`
	UserID           string          `json:"user_id" db:"user_id"`
	URL              string          `json:"url" db:"url"`
	Title            *string         `json:"title" db:"title"`
	Status           string          `json:"status" db:"status"`
	HTMLVersion      *string         `json:"htmlVersion" db:"html_version"`
	HeadingTags      *HeadingTags    `json:"headingTags" db:"heading_tags"`
	InternalLinks    *int            `json:"internalLinks" db:"internal_links"`
	ExternalLinks    *int            `json:"externalLinks" db:"external_links"`
	BrokenLinks      *BrokenLinks    `json:"brokenLinks" db:"broken_links"`
	HasLoginForm     *bool           `json:"hasLoginForm" db:"has_login_form"`
	ErrorMessage     *string         `json:"errorMessage" db:"error_message"`
	AnalysisDuration *int            `json:"analysisDuration" db:"analysis_duration"`
	CreatedAt        time.Time       `json:"createdAt" db:"created_at"`
	UpdatedAt        time.Time       `json:"updatedAt" db:"updated_at"`
}

type HeadingTags map[string]int

func (h *HeadingTags) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	
	return json.Unmarshal(bytes, h)
}

func (h HeadingTags) Value() (driver.Value, error) {
	if h == nil {
		return nil, nil
	}
	return json.Marshal(h)
}

type BrokenLink struct {
	URL        string `json:"url"`
	StatusCode int    `json:"statusCode"`
	Error      string `json:"error"`
}

type BrokenLinks []BrokenLink

func (b *BrokenLinks) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	
	return json.Unmarshal(bytes, b)
}

func (b BrokenLinks) Value() (driver.Value, error) {
	if b == nil {
		return nil, nil
	}
	return json.Marshal(b)
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CreateURLRequest struct {
	URL string `json:"url" binding:"required,url"`
}

type DeleteURLsRequest struct {
	IDs []string `json:"ids" binding:"required"`
}

type WebSocketMessage struct {
	Type      string      `json:"type"`
	URL       string      `json:"url,omitempty"`
	Status    string      `json:"status,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Progress  int         `json:"progress,omitempty"`
	Message   string      `json:"message,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}
