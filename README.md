# Web Crawler Backend

A complete Go backend for the Web Crawler application with MySQL database, JWT authentication, WebSocket support, and comprehensive web crawling functionality.

## Features

### 🔐 Authentication
- JWT-based authentication with secure token generation
- User registration and login
- Token refresh mechanism
- Protected API endpoints

### 🕷️ Web Crawling
- **HTML Version Detection**: Identifies HTML5, XHTML, and legacy HTML versions
- **Page Title Extraction**: Extracts and stores page titles
- **Heading Tags Analysis**: Counts H1-H6 tags for SEO analysis
- **Link Analysis**: Categorizes internal vs external links
- **Broken Link Detection**: Identifies 4xx/5xx status code links
- **Login Form Detection**: Automatically detects login forms on pages

### 🔄 Real-time Updates
- WebSocket integration for live status updates
- Real-time crawling progress notifications
- Broadcast system for multiple clients

### 🗄️ Database
- MySQL database with proper schema design
- Automatic migrations on startup
- JSON storage for complex data structures
- Optimized queries with indexing

## API Endpoints

### Authentication
\`\`\`
POST /api/auth/login      - User login
POST /api/auth/logout     - User logout
POST /api/auth/refresh    - Refresh JWT token
GET  /api/auth/me         - Get current user info
\`\`\`

### URL Management
\`\`\`
GET    /api/urls          - List URLs with pagination/search
POST   /api/urls          - Add new URL for crawling
DELETE /api/urls          - Delete multiple URLs
GET    /api/urls/:id      - Get specific URL details
POST   /api/urls/:id/start - Start crawling a URL
POST   /api/urls/:id/stop  - Stop crawling a URL
POST   /api/urls/:id/rerun - Rerun analysis for a URL
\`\`\`

### WebSocket
\`\`\`
WS /ws - Real-time updates with token authentication
\`\`\`

## Setup Instructions

### Prerequisites
- Go 1.21+
- MySQL 8.0+
- Git

### Local Development

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd web-crawler-backend
\`\`\`

2. **Install dependencies**
\`\`\`bash
go mod download
\`\`\`

3. **Setup MySQL database**
\`\`\`sql
CREATE DATABASE webcrawler;
CREATE USER 'crawler'@'localhost' IDENTIFIED BY 'crawlerpass';
GRANT ALL PRIVILEGES ON webcrawler.* TO 'crawler'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

4. **Configure environment variables**
\`\`\`bash
cp .env.example .env
# Edit .env with your database credentials
\`\`\`

5. **Run the application**
\`\`\`bash
go run main.go
\`\`\`

### Docker Deployment

1. **Using Docker Compose (Recommended)**
\`\`\`bash
docker-compose up -d
\`\`\`

2. **Manual Docker Build**
\`\`\`bash
docker build -t web-crawler-backend .
docker run -p 8080:8080 web-crawler-backend
\`\`\`

## Environment Variables

\`\`\`env
PORT=8080
ENVIRONMENT=development
DATABASE_URL=root:password@tcp(localhost:3306)/webcrawler?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=your-super-secret-jwt-key-change-in-production
\`\`\`

## Database Schema

### Users Table
- `id` - UUID primary key
- `username` - Unique username
- `email` - User email
- `password_hash` - Bcrypt hashed password
- `role` - User role (admin/user)
- `created_at`, `updated_at` - Timestamps

### URLs Table
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `url` - Target URL to crawl
- `title` - Extracted page title
- `status` - Crawling status (queued/running/completed/error)
- `html_version` - Detected HTML version
- `heading_tags` - JSON object with heading tag counts
- `internal_links` - Count of internal links
- `external_links` - Count of external links
- `broken_links` - JSON array of broken links
- `has_login_form` - Boolean for login form detection
- `error_message` - Error details if crawling failed
- `analysis_duration` - Time taken for analysis in milliseconds
- `created_at`, `updated_at` - Timestamps

## WebSocket Messages

### Status Update
\`\`\`json
{
  "type": "status_update",
  "url": "https://example.com",
  "status": "completed",
  "data": {
    "title": "Example Site",
    "internalLinks": 12,
    "externalLinks": 5
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

### Error Message
\`\`\`json
{
  "type": "error",
  "url": "https://example.com",
  "error": "Connection timeout",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

## Default Credentials

For development, a default admin user is created:
- **Username**: `admin`
- **Password**: `password`

**⚠️ Change these credentials in production!**

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Protection**: Configurable CORS policies
- **Input Validation**: Request validation and sanitization
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Built-in protection against abuse

## Performance Optimizations

- **Connection Pooling**: Optimized database connections
- **Concurrent Crawling**: Goroutines for parallel processing
- **Efficient Queries**: Indexed database queries
- **WebSocket Broadcasting**: Efficient real-time updates

## Testing

\`\`\`bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific test
go test ./internal/services -v
\`\`\`

## Production Deployment

1. **Set strong JWT secret**
2. **Configure proper CORS origins**
3. **Use environment variables for sensitive data**
4. **Set up proper logging**
5. **Configure reverse proxy (nginx)**
6. **Set up SSL/TLS certificates**
7. **Configure database backups**

## Monitoring

- Health check endpoint: `GET /health`
- Structured logging throughout the application
- WebSocket connection monitoring
- Database connection health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
