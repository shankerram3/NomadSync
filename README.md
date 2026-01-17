# NomadSync

A collaborative AI-powered travel planning application that helps groups plan trips together through natural language conversations.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🎯 Overview

NomadSync is a full-stack web application that combines AI agents, collaborative planning, and real-time updates to make trip planning seamless. Users can chat with an AI agent to plan trips, resolve conflicts through voting, and track trip readiness as the plan evolves.

### Key Concepts

- **Trip Memory**: AI extracts and tracks trip details (destination, dates, budget, pace, duration) with confidence scores
- **Plan Versioning**: Multiple plan versions per trip with version history
- **Conflict Resolution**: Vote-based system for resolving planning conflicts between travelers
- **Agent Workflow**: LangGraph-powered AI agent that processes user messages and generates plans

## ✨ Features

### ✅ Implemented

- **User Authentication**: JWT-based authentication with registration and login
- **Trip Management**: Create, view, update, and manage multiple trips
- **Chat Interface**: Real-time chat with AI agent for trip planning
- **Trip Memory**: AI extracts and tracks trip details with confidence scores
- **Plan Versioning**: Multiple plan versions per trip with version history
- **Conflict Resolution**: Vote-based system for resolving planning conflicts
- **Collaborative Features**: Multi-user trip planning with member management
- **Responsive UI**: Modern, clean interface built with React and Tailwind CSS
- **Docker Support**: Full containerization for easy deployment
- **Navigation**: Seamless navigation between trips dashboard and planner

### 🚧 In Progress

- **Agent Workflow Integration**: Connecting LangGraph workflow to chat messages
- **Dynamic Plan Generation**: Real-time plan updates from agent responses
- **Memory Auto-updates**: Automatic trip memory updates from conversations
- **Real-time Collaboration**: WebSocket/SSE for live updates

### 📋 Planned

- **External API Integrations**: 
  - Flight search (Amadeus, Skyscanner)
  - Hotel booking (Booking.com, Expedia)
  - Weather forecasts (OpenWeatherMap)
  - Attractions and activities research (Google Places, TripAdvisor)
- **Advanced Plan Features**: 
  - Lock plans to prevent changes
  - Compare plan versions side-by-side
  - Regenerate plans with specific changes
- **Enhanced Conflict UI**: 
  - Full conflict details and resolution flow
  - Conflict history and analytics
- **Real-time Updates**: 
  - WebSocket/SSE for live collaboration
  - Push notifications for trip updates

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript - Modern UI framework
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Hook Form** - Form handling

### Backend
- **FastAPI** - Modern Python web framework with automatic API docs
- **MongoDB** with Motor - Async MongoDB driver
- **LangGraph** - AI agent workflow orchestration
- **OpenAI API** - LLM integration for AI agent
- **JWT** (python-jose) - Token-based authentication
- **Pydantic** - Data validation and settings management
- **Uvicorn** - ASGI server

### Infrastructure
- **Docker** and **Docker Compose** - Containerization
- **Nginx** - Reverse proxy and static file serving
- **MongoDB** - NoSQL database

## 🚀 Quick Start

### Prerequisites

- **Docker and Docker Compose** (recommended)
  - Docker Desktop: https://www.docker.com/products/docker-desktop
  - Or Docker Engine + Docker Compose
- **Node.js 20+** (for local development only)
- **Python 3.11+** (for local development only)
- **MongoDB** (or use Docker - recommended)

### Using Docker (Recommended)

This is the easiest way to get started:

1. **Clone the repository**
   ```bash
   git clone https://github.com/shankerram3/NomadSync.git
   cd NomadSync
   ```

2. **Create environment file** (optional, for custom config)
   ```bash
   # Create .env in project root
   cat > .env << EOF
   JWT_SECRET=$(openssl rand -hex 32)
   OPENAI_API_KEY=your-openai-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   EOF
   ```

3. **Build and start services**
   ```bash
   docker-compose up --build
   ```

   This will start:
   - MongoDB on port 27017
   - Backend API on port 8000
   - Frontend on port 80

4. **Access the application**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:8000
   - **API Docs (Swagger)**: http://localhost:8000/docs
   - **API Docs (ReDoc)**: http://localhost:8000/redoc

5. **Stop services**
   ```bash
   docker-compose down
   ```

   To remove volumes (database data):
   ```bash
   docker-compose down -v
   ```

### Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create .env file**
   ```bash
   cat > .env << EOF
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=nomadsync
   JWT_SECRET=dev-secret-please-change-in-production
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=7
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   EOF
   ```

5. **Start MongoDB** (if not using Docker)
   ```bash
   # Using Docker (easiest)
   docker run -d -p 27017:27017 --name mongodb mongo:7
   
   # Or install MongoDB locally
   # macOS: brew install mongodb-community
   # Ubuntu: apt-get install mongodb
   ```

6. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at http://localhost:8000

#### Frontend Setup

1. **Navigate to project root**
   ```bash
   cd ..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file** (optional)
   ```bash
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000

6. **Build for production**
   ```bash
   npm run build
   npm run preview  # Preview production build
   ```

## 📖 Usage Guide

### Creating Your First Trip

1. **Register/Login**: Create an account or login at the home page
2. **Create Trip**: Click "New Trip" button on the trips dashboard
3. **Start Planning**: Click on a trip to open the planner interface

### Using the Chat Interface

1. **Send Messages**: Type your trip requirements in natural language
   - Example: "I want to go to Japan for 7 days in March with a budget of $3000"
2. **View Memory**: Check the "Trip Memory" tab to see what the AI has extracted
3. **View Plans**: Switch to the "Plan" tab to see generated itineraries

### Trip Memory

The AI automatically extracts trip information from conversations:
- **Destination**: Where you want to go
- **Dates**: Start and end dates
- **Budget**: Total or per-person budget
- **Pace**: Fast-paced or relaxed trip style
- **Duration**: Number of days

Each field shows a confidence score (0-100%) indicating how certain the AI is about the information.

### Conflict Resolution

When there are disagreements or choices:
1. The AI will present conflict options
2. Trip members can vote on their preferred option
3. The option with the most votes wins

### Plan Versions

- Each plan update creates a new version
- View all versions via the plan history
- Compare different versions to see what changed

## 📡 API Documentation

### Base URL

- **Docker**: `http://localhost/api` (proxied through nginx)
- **Local Dev**: `http://localhost:8000`

All endpoints require authentication except `/auth/register` and `/auth/login`.

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "avatar_emoji": "👤"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=securepassword
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

### Trips

#### List Trips
```http
GET /trips
Authorization: Bearer <access_token>
```

#### Create Trip
```http
POST /trips
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Japan Adventure",
  "destination": "Tokyo, Japan",
  "dates": {
    "start": "2024-03-15T00:00:00Z",
    "end": "2024-03-22T00:00:00Z"
  },
  "status": "draft"
}
```

#### Get Trip
```http
GET /trips/{trip_id}
Authorization: Bearer <access_token>
```

#### Update Trip
```http
PATCH /trips/{trip_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Trip Title",
  "readiness": 75
}
```

### Messages

#### Get Messages
```http
GET /trips/{trip_id}/messages?limit=50&cursor=<message_id>
Authorization: Bearer <access_token>
```

#### Create Message
```http
POST /trips/{trip_id}/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "human",
  "content": "I want to visit Tokyo in March"
}
```

### Memory

#### Get Trip Memory
```http
GET /trips/{trip_id}/memory
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "...",
  "trip_id": "...",
  "destination": {
    "value": "Tokyo, Japan",
    "confidence": 95,
    "sources": ["msg_123", "msg_124"]
  },
  "dates": {
    "value": "March 15-22, 2024",
    "confidence": 88,
    "sources": ["msg_123"]
  },
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Plans

#### Get Plan (Latest)
```http
GET /trips/{trip_id}/plan
Authorization: Bearer <access_token>
```

#### Get Specific Plan Version
```http
GET /trips/{trip_id}/plan?version=2
Authorization: Bearer <access_token>
```

#### Create Plan Version
```http
POST /trips/{trip_id}/plan
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "itinerary": {
    "day_1": {
      "activities": [...],
      "cost": 150
    }
  }
}
```

### Conflicts

#### Get Conflicts
```http
GET /trips/{trip_id}/conflicts
Authorization: Bearer <access_token>
```

#### Vote on Conflict
```http
POST /trips/{trip_id}/conflicts/{conflict_id}/vote
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "option_key": "a"
}
```

### Agents

#### Run Agent Workflow
```http
POST /agents/plan
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Plan a 7-day trip to Tokyo",
  "trip_context": {...},
  "trip_memory": {...}
}
```

**Full API Documentation**: Visit `http://localhost:8000/docs` when the backend is running for interactive API documentation with Swagger UI.

## 🏗 Architecture

### System Architecture

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP/HTTPS
       │
┌──────▼─────────────────┐
│   Nginx (Port 80)      │
│  - Static files        │
│  - API proxy (/api)    │
└──────┬─────────────────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│  Frontend   │ │  Backend  │ │  MongoDB  │
│   (React)   │ │  (FastAPI)│ │   (Port   │
│   (Port 80) │ │  (Port    │ │   27017)  │
│             │ │  8000)    │ │           │
└─────────────┘ └───────────┘ └───────────┘
                      │
                      │ OpenAI API
                      ▼
              ┌───────────────┐
              │   LangGraph   │
              │  Agent Workflow│
              └───────────────┘
```

### Agent Workflow

The application uses LangGraph to create an AI agent workflow:

```
User Message
    │
    ▼
┌─────────────────┐
│  Parse Intent   │ ── Extract structured data (destinations, dates, budget, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Task Plan│ ── Generate ordered tasks (flights, hotels, itinerary)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Check Clarification│ ── Determine if more info needed
└────────┬────────┘
         │
         ├─ Yes → Return clarification question
         │
         └─ No ──►
                  │
                  ▼
           ┌──────────────┐
           │Execute Tasks │ ── Run planned tasks (stubbed for external APIs)
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │Synthesize    │ ── Generate natural language response
           │Response      │
           └──────────────┘
```

### Data Flow

```
User Message → Chat Interface → Backend API → Agent Workflow
                                                      │
                                                      ▼
Trip Memory ← Memory Service ← Agent Response ← Task Execution
     │
     │
     ▼
Plan Updates → Plan Service → UI Updates
```

### Database Schema

#### Collections

- **users**: User accounts and authentication
  - `userId`, `email`, `password_hash`, `name`, `avatar_emoji`

- **trips**: Trip metadata and settings
  - `tripId`, `title`, `destination`, `dates`, `status`, `readiness`, `members[]`

- **messages**: Chat messages
  - `_id`, `tripId`, `authorId`, `type` (human/agent/conflict), `content`, `conflictId`

- **trip_memory**: Extracted trip information
  - `_id`, `tripId`, `destination`, `dates`, `budget`, `pace`, `duration` (each with value, confidence, sources)

- **plan_versions**: Generated trip plans
  - `_id`, `tripId`, `version`, `itinerary`, `createdBy`, `createdAt`

- **conflicts**: Planning conflicts
  - `_id`, `tripId`, `messageId`, `options[]` (with votes), `createdAt`

### Component Structure

#### Frontend Components

```
App.tsx
├── LoginPage.tsx
├── ProtectedRoute.tsx
├── TripsPage.tsx (Dashboard)
│   └── Trip cards, search, filters
└── TripPlanner.tsx
    ├── TripSidebar.tsx
    │   ├── Trip info
    │   ├── Members list
    │   └── Readiness indicator
    ├── ChatPanel.tsx
    │   ├── MessageList
    │   ├── HumanMessage
    │   ├── AgentMessage
    │   └── ConflictMessage
    └── MemoryPlanPanel.tsx
        ├── MemoryView
        └── PlanView
```

## 🔧 Configuration

### Environment Variables

#### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB` | Database name | `nomadsync` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiration | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiration | `30` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |
| `OPENAI_API_KEY` | OpenAI API key | Required for agent features |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` |

#### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

### Docker Compose Configuration

The `docker-compose.yml` file configures three services:

- **mongodb**: MongoDB database
- **backend**: FastAPI application
- **frontend**: React application served by Nginx

All services communicate through a Docker network (`nomadsync-network`).

## 🧪 Development

### Project Structure

```
NomadSync/
├── backend/
│   ├── app/
│   │   ├── agents/          # LangGraph agent workflows
│   │   │   └── langgraph_workflow.py
│   │   ├── models/          # Pydantic models
│   │   │   ├── user.py
│   │   │   ├── trip.py
│   │   │   ├── message.py
│   │   │   ├── memory.py
│   │   │   ├── plan.py
│   │   │   └── conflict.py
│   │   ├── routers/         # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── trips.py
│   │   │   ├── messages.py
│   │   │   ├── memory.py
│   │   │   ├── plan.py
│   │   │   ├── conflicts.py
│   │   │   └── agent.py
│   │   ├── utils/           # Utility functions
│   │   │   ├── auth.py
│   │   │   └── trip_permissions.py
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # MongoDB connection
│   │   └── main.py          # FastAPI app
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .dockerignore
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── LoginPage.tsx
│   │   ├── TripsPage.tsx
│   │   ├── TripPlanner.tsx
│   │   ├── TripSidebar.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── MemoryPlanPanel.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── services/            # API service clients
│   │   ├── auth.ts
│   │   ├── trips.ts
│   │   ├── messages.ts
│   │   ├── memory.ts
│   │   ├── plan.ts
│   │   └── conflicts.ts
│   ├── lib/                # Utilities
│   │   └── api.ts
│   ├── styles/             # CSS
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── docker-compose.yml
├── Dockerfile              # Frontend Dockerfile
├── nginx.conf
├── .dockerignore
└── README.md
```

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html

# Frontend tests (when implemented)
npm test

# Watch mode
npm test -- --watch
```

### Code Style

#### Backend
- Follow **PEP 8** style guide
- Use type hints for all functions
- Maximum line length: 100 characters
- Use `Black` for formatting: `black app/`
- Use `isort` for imports: `isort app/`

#### Frontend
- Use **TypeScript** with strict mode
- Follow **React best practices**
- Use functional components with hooks
- Use **Prettier** for formatting: `npm run format`
- Use **ESLint** for linting: `npm run lint`

### Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: Add new feature"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Follow commit message convention**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test changes
   - `chore:` Build/tooling changes

## 🚀 Deployment

### Docker Production Build

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Set production environment variables**
   ```bash
   export JWT_SECRET=<strong-secret>
   export OPENAI_API_KEY=<your-key>
   ```

3. **Start services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Manual Deployment

#### Backend

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**
   ```bash
   export MONGODB_URI=mongodb://your-mongo-host:27017
   export JWT_SECRET=<your-secret>
   # ... other variables
   ```

3. **Run with production server**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

#### Frontend

1. **Build production bundle**
   ```bash
   npm run build
   ```

2. **Serve with Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:8000;
       }
   }
   ```

### Security Considerations

- **JWT Secret**: Use a strong, random secret in production
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configure CORS origins properly
- **Environment Variables**: Never commit `.env` files
- **Database**: Use authentication for MongoDB in production
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Input Validation**: All inputs are validated via Pydantic

## 🔍 Troubleshooting

### Common Issues

#### Backend won't start

**Problem**: MongoDB connection error
```bash
# Solution: Check MongoDB is running
docker ps | grep mongo
# Or check connection string in .env
```

**Problem**: Port 8000 already in use
```bash
# Solution: Change port or kill process
lsof -ti:8000 | xargs kill -9
# Or use different port: uvicorn app.main:app --port 8001
```

#### Frontend won't connect to backend

**Problem**: CORS errors
```bash
# Solution: Check CORS_ORIGINS includes your frontend URL
# In backend/.env:
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Problem**: API calls fail
```bash
# Solution: Check VITE_API_URL is correct
# In .env:
VITE_API_URL=http://localhost:8000
```

#### Docker issues

**Problem**: Containers won't start
```bash
# Solution: Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild containers
docker-compose down
docker-compose up --build
```

**Problem**: Database data lost
```bash
# Solution: Docker volumes might be removed
# Don't use -v flag unless you want to delete data
# Check volumes: docker volume ls
```

#### Authentication issues

**Problem**: Token expired
```bash
# Solution: Refresh token or re-login
# Tokens expire after ACCESS_TOKEN_EXPIRE_MINUTES
```

**Problem**: Invalid credentials
```bash
# Solution: Check email/password are correct
# Check backend logs for error details
```

### Debugging Tips

1. **Check backend logs**
   ```bash
   docker-compose logs -f backend
   ```

2. **Check frontend console**
   - Open browser DevTools (F12)
   - Check Console and Network tabs

3. **Test API directly**
   ```bash
   curl http://localhost:8000/health
   curl -X POST http://localhost:8000/auth/login \
     -d "username=test@example.com&password=test"
   ```

4. **Check MongoDB data**
   ```bash
   docker exec -it nomadsync-mongodb mongosh
   use nomadsync
   db.trips.find().pretty()
   ```

## 📊 Current Status

### Completed (~60%)
- ✅ Core infrastructure and setup
- ✅ Authentication and authorization
- ✅ Trip CRUD operations
- ✅ Chat interface UI
- ✅ Memory and plan data models
- ✅ Conflict resolution structure
- ✅ Docker containerization
- ✅ Agent workflow skeleton
- ✅ Navigation improvements

### In Progress (~30%)
- 🚧 Agent workflow integration
- 🚧 Dynamic plan generation
- 🚧 Memory auto-updates
- 🚧 Real-time collaboration features

### Planned (~10%)
- 📋 External API integrations (flights, hotels, weather)
- 📋 Advanced plan features (lock, compare, regenerate)
- 📋 Enhanced conflict resolution UI
- 📋 WebSocket/SSE for real-time updates
- 📋 Testing suite

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, readable code
   - Add comments where necessary
   - Follow existing code style
   - Update documentation if needed

4. **Test your changes**
   ```bash
   # Backend
   cd backend && pytest
   
   # Frontend
   npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: Add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Include screenshots if UI changes

### Development Guidelines

- Write meaningful commit messages
- Keep PRs focused and small
- Add tests for new features
- Update documentation
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- UI components from [shadcn/ui](https://ui.shadcn.com/) - Beautiful React components
- Agent workflows powered by [LangGraph](https://github.com/langchain-ai/langgraph) - AI agent orchestration
- Icons from [Lucide](https://lucide.dev/) - Icon library

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/shankerram3/NomadSync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shankerram3/NomadSync/discussions)

For questions or support, please open an issue on GitHub.

---

**Note**: This project is in active development. Some features may be incomplete or subject to change. We welcome feedback and contributions!
