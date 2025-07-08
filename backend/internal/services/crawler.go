package services

import (
	"database/sql"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"web-crawler/internal/models"

	"golang.org/x/net/html"
)

type CrawlerService struct {
	db     *sql.DB
	client *http.Client
}

type CrawlResult struct {
	Title         string
	HTMLVersion   string
	HeadingTags   models.HeadingTags
	InternalLinks int
	ExternalLinks int
	BrokenLinks   models.BrokenLinks
	HasLoginForm  bool
	Duration      time.Duration
}

func NewCrawlerService(db *sql.DB) *CrawlerService {
	return &CrawlerService{
		db: db,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *CrawlerService) CrawlURL(targetURL string) (*CrawlResult, error) {
	startTime := time.Now()

	// Fetch the webpage
	resp, err := s.client.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	// Parse HTML
	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	result := &CrawlResult{
		HeadingTags: make(models.HeadingTags),
		BrokenLinks: make(models.BrokenLinks, 0),
	}

	// Extract data from HTML
	s.extractData(doc, targetURL, result)

	result.Duration = time.Since(startTime)

	return result, nil
}

func (s *CrawlerService) extractData(n *html.Node, baseURL string, result *CrawlResult) {
	if n.Type == html.ElementNode {
		switch n.Data {
		case "html":
			// Extract HTML version from doctype or html attributes
			result.HTMLVersion = s.extractHTMLVersion(n)
		case "title":
			if n.FirstChild != nil {
				result.Title = strings.TrimSpace(n.FirstChild.Data)
			}
		case "h1", "h2", "h3", "h4", "h5", "h6":
			result.HeadingTags[n.Data]++
		case "a":
			s.processLink(n, baseURL, result)
		case "form":
			if s.isLoginForm(n) {
				result.HasLoginForm = true
			}
		}
	}

	// Recursively process child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.extractData(c, baseURL, result)
	}
}

func (s *CrawlerService) extractHTMLVersion(n *html.Node) string {
	// Check for HTML5 doctype or modern attributes
	if n.Parent != nil && n.Parent.Type == html.DocumentNode {
		for c := n.Parent.FirstChild; c != nil; c = c.NextSibling {
			if c.Type == html.DoctypeNode {
				if strings.Contains(strings.ToLower(c.Data), "html") {
					return "HTML5"
				}
			}
		}
	}

	// Check for HTML attributes that indicate version
	for _, attr := range n.Attr {
		if attr.Key == "xmlns" && strings.Contains(attr.Val, "xhtml") {
			return "XHTML"
		}
	}

	return "HTML5" // Default assumption for modern websites
}

func (s *CrawlerService) processLink(n *html.Node, baseURL string, result *CrawlResult) {
	var href string
	for _, attr := range n.Attr {
		if attr.Key == "href" {
			href = attr.Val
			break
		}
	}

	if href == "" {
		return
	}

	// Parse base URL
	base, err := url.Parse(baseURL)
	if err != nil {
		return
	}

	// Parse link URL
	linkURL, err := url.Parse(href)
	if err != nil {
		return
	}

	// Resolve relative URLs
	resolvedURL := base.ResolveReference(linkURL)

	// Determine if internal or external
	if resolvedURL.Host == base.Host || resolvedURL.Host == "" {
		result.InternalLinks++
	} else {
		result.ExternalLinks++
	}

	// Check if link is broken (simplified check)
	go s.checkBrokenLink(resolvedURL.String(), result)
}

func (s *CrawlerService) checkBrokenLink(linkURL string, result *CrawlResult) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Head(linkURL)
	if err != nil {
		result.BrokenLinks = append(result.BrokenLinks, models.BrokenLink{
			URL:        linkURL,
			StatusCode: 0,
			Error:      err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		result.BrokenLinks = append(result.BrokenLinks, models.BrokenLink{
			URL:        linkURL,
			StatusCode: resp.StatusCode,
			Error:      resp.Status,
		})
	}
}

func (s *CrawlerService) isLoginForm(n *html.Node) bool {
	// Look for common login form indicators
	hasPasswordField := false
	hasUsernameField := false

	s.checkFormFields(n, &hasPasswordField, &hasUsernameField)

	return hasPasswordField && hasUsernameField
}

func (s *CrawlerService) checkFormFields(n *html.Node, hasPassword, hasUsername *bool) {
	if n.Type == html.ElementNode && n.Data == "input" {
		var inputType, inputName string
		for _, attr := range n.Attr {
			switch attr.Key {
			case "type":
				inputType = attr.Val
			case "name":
				inputName = attr.Val
			}
		}

		if inputType == "password" {
			*hasPassword = true
		}

		if inputType == "text" || inputType == "email" {
			lowerName := strings.ToLower(inputName)
			if strings.Contains(lowerName, "user") || strings.Contains(lowerName, "email") || strings.Contains(lowerName, "login") {
				*hasUsername = true
			}
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkFormFields(c, hasPassword, hasUsername)
	}
}

func (s *CrawlerService) UpdateURLStatus(urlID, status string, result *CrawlResult, errorMsg string) error {
	query := `UPDATE urls SET status = ?, updated_at = ?`
	args := []interface{}{status, time.Now()}

	if result != nil {
		query += `, title = ?, html_version = ?, heading_tags = ?, internal_links = ?, 
				   external_links = ?, broken_links = ?, has_login_form = ?, analysis_duration = ?`

		headingTagsJSON, _ := result.HeadingTags.Value()
		brokenLinksJSON, _ := result.BrokenLinks.Value()

		args = append(args, result.Title, result.HTMLVersion, headingTagsJSON,
			result.InternalLinks, result.ExternalLinks, brokenLinksJSON,
			result.HasLoginForm, int(result.Duration.Milliseconds()))
	}

	if errorMsg != "" {
		query += `, error_message = ?`
		args = append(args, errorMsg)
	}

	query += ` WHERE id = ?`
	args = append(args, urlID)

	_, err := s.db.Exec(query, args...)
	return err
}
