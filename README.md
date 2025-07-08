# Web Crawler Dashboard

A full-stack web crawler application with a React/TypeScript frontend and Go backend. The application allows users to crawl websites, analyze their content, and view detailed analytics through a modern dashboard interface.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Go with Gin framework, JWT authentication, and WebSocket support
- **Database**: MySQL 8.0+
- **Real-time**: WebSocket connections for live updates

## ✨ Features

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

### 📊 Dashboard Features
- Real-time crawling status updates
- Sortable and paginated URL table
- Interactive charts and analytics
- Search and filtering capabilities
- Responsive design for all devices

### 🔄 Real-time Updates
- WebSocket integration for live status updates
- Real-time crawling progress notifications
- Broadcast system for multiple clients

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Go** 1.21+
- **MySQL** 8.0+
- **Docker** and Docker Compose (optional)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd web-crawler-dashboard
\`\`\`

2. **Start with Docker Compose**
\`\`\`bash
# Production build
docker-compose up --build

# Development with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
\`\`\`

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Default credentials: `admin` / `password`

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend directory**
\`\`\`bash
cd backend
\`\`\`

2. **Install Go dependencies**
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
# Create .env file in backend directory
cat > .env << EOF
PORT=8080
ENVIRONMENT=development
DATABASE_URL=crawler:crawlerpass@tcp(localhost:3306)/webcrawler?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF
\`\`\`

5. **Run the backend**
\`\`\`bash
go run main.go
\`\`\`

#### Frontend Setup

1. **Navigate to project root**
\`\`\`bash
cd ..  # from backend directory
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. **Configure environment variables**
\`\`\`bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080
EOF
\`\`\`

4. **Run the frontend**
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
\`\`\`env
PORT=8080
ENVIRONMENT=development
DATABASE_URL=user:password@tcp(host:port)/database?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=your-super-secret-jwt-key-change-in-production
\`\`\`

#### Frontend (.env.local)
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8080
\`\`\`

### Database Schema

The application automatically creates the required tables on startup:

#### Users Table
- `id` - UUID primary key
- `username` - Unique username
- `email` - User email
- `password_hash` - Bcrypt hashed password
- `role` - User role (admin/user)
- `created_at`, `updated_at` - Timestamps

#### URLs Table
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

## 📡 API Documentation

### Authentication Endpoints
\`\`\`
POST /api/auth/login      - User login
POST /api/auth/logout     - User logout
POST /api/auth/refresh    - Refresh JWT token
GET  /api/auth/me         - Get current user info
\`\`\`

### URL Management Endpoints
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

### Example API Usage

#### Login
\`\`\`bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
\`\`\`

#### Add URL for crawling
\`\`\`bash
curl -X POST http://localhost:8080/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url": "https://example.com"}'
\`\`\`

## 🐳 Docker Commands

### Build and run everything
\`\`\`bash
docker-compose up --build
\`\`\`

### Run in development mode with hot reload
\`\`\`bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
\`\`\`

### Build backend only
\`\`\`bash
cd backend
docker build -t webcrawler-backend .
docker run -p 8080:8080 webcrawler-backend
\`\`\`

### Build frontend only
\`\`\`bash
docker build -f Dockerfile.frontend -t webcrawler-frontend .
docker run -p 3000:3000 webcrawler-frontend
\`\`\`

## 🧪 Testing

### Backend Tests
\`\`\`bash
cd backend
go test ./...

# With coverage
go test -cover ./...

# Specific package
go test ./internal/services -v
\`\`\`

### Frontend Tests
\`\`\`bash
npm test
# or
yarn test
\`\`\`

## 🚀 Production Deployment

### Using Docker
\`\`\`bash
# Build production images
docker-compose build

# Deploy with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
\`\`\`

### Manual Deployment

#### Backend
\`\`\`bash
cd backend
go build -o webcrawler-backend main.go
./webcrawler-backend
\`\`\`

#### Frontend
\`\`\`bash
npm run build
npm start
\`\`\`

## 🔒 Security Considerations

- Change default JWT secret in production
- Use strong database passwords
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Use environment variables for sensitive data
- Configure reverse proxy (nginx/Apache)
- Set up database backups
- Enable rate limiting

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Structured logging throughout the application
- WebSocket connection monitoring
- Database connection health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues
\`\`\`bash
# Check if MySQL is running
sudo systemctl status mysql

# Reset database
mysql -u root -p
DROP DATABASE webcrawler;
CREATE DATABASE webcrawler;
\`\`\`

#### Port Already in Use
\`\`\`bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
\`\`\`

#### Docker Issues
\`\`\`bash
# Clean up Docker
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose up --build --force-recreate
\`\`\`

### Getting Help

If you encounter any issues:

1. Check the logs: `docker-compose logs`
2. Verify environment variables are set correctly
3. Ensure all prerequisites are installed
4. Check if ports 3000 and 8080 are available
5. Open an issue on GitHub with detailed error information

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints
- Verify your environment setup
