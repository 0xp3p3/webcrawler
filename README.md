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
```bash
git clone https://github.com/0xp3p3/webcrawler.git
cd web-crawler-dashboard
```

2. **Start with Docker Compose**
```bash
# Production build
docker-compose up --build

# Development with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Default credentials: `admin` / `password`

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install Go dependencies**
```bash
go mod download
```

3. **Setup MySQL database**
```sql
CREATE DATABASE webcrawler;
CREATE USER 'crawler'@'localhost' IDENTIFIED BY 'crawlerpass';
GRANT ALL PRIVILEGES ON webcrawler.* TO 'crawler'@'localhost';
FLUSH PRIVILEGES;
```

4. **Configure environment variables**
```bash
# Create .env file in backend directory
cat > .env << EOF
PORT=8080
ENVIRONMENT=development
DATABASE_URL=crawler:crawlerpass@tcp(localhost:3306)/webcrawler?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF
```

5. **Run the backend**
```bash
go run main.go
```

#### Frontend Setup

1. **Navigate to project root**
```bash
cd ..  # from backend directory
```

2. **Install dependencies**
```bash
npm install pnpm -g
pnpm install
```

3. **Configure environment variables**
```bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
EOF
```

4. **Run the frontend**
```bash
pnpm run dev
# or build
pnpm run build
pnpm run start
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=8080
ENVIRONMENT=development
DATABASE_URL=user:password@tcp(host:port)/database?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

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
```
POST /api/auth/login      - User login
POST /api/auth/logout     - User logout
POST /api/auth/refresh    - Refresh JWT token
GET  /api/auth/me         - Get current user info
```

### URL Management Endpoints
```
GET    /api/urls          - List URLs with pagination/search
POST   /api/urls          - Add new URL for crawling
DELETE /api/urls          - Delete multiple URLs
GET    /api/urls/:id      - Get specific URL details
POST   /api/urls/:id/start - Start crawling a URL
POST   /api/urls/:id/stop  - Stop crawling a URL
POST   /api/urls/:id/rerun - Rerun analysis for a URL
```

### WebSocket
```
WS /ws - Real-time updates with token authentication
```

### Example API Usage

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

#### Add URL for crawling
```bash
curl -X POST http://localhost:8080/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url": "https://example.com"}'
```

![Dashboard](https://github.com/0xp3p3/webcrawler/blob/a07e670be594f308157a3bdbec788a2256d174ff/public/assets/dashboard.png?raw=true)

![URL Details](https://github.com/0xp3p3/webcrawler/blob/a07e670be594f308157a3bdbec788a2256d174ff/public/assets/details-0.png?raw=true)

![URL Details](https://github.com/0xp3p3/webcrawler/blob/a07e670be594f308157a3bdbec788a2256d174ff/public/assets/details-1.png?raw=true)
