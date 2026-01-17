# NomadSync - Collaborative Travel Planner

A modern, AI-powered collaborative travel planning application that helps groups plan trips together. Built with React, FastAPI, and MongoDB.

![NomadSync](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.128.0-009688?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-4.16.0-47A248?logo=mongodb)

## 📋 Table of Contents

- [Features](#-features)
- [Implementation Status](#-implementation-status)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [LangGraph Agent Workflow](#-langgraph-agent-workflow)
- [Architecture](#-architecture)
- [Database Schema](#️-database-schema)
- [Missing Features & Future Implementations](#-missing-features--future-implementations)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

## 🎯 Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Trip Management**: Create, view, and manage multiple trips
- **Collaborative Planning**: Real-time chat interface for group discussions
- **AI-Powered Memory**: Automatically extracts and stores trip preferences and decisions
- **Plan Versioning**: Track multiple versions of trip plans
- **Conflict Resolution**: Vote-based system for resolving planning conflicts
- **LangGraph Agent**: AI-powered trip planning workflow with OpenAI integration
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Framer Motion
- **Role-Based Access**: Trip members with different permission levels

## ✅ Implementation Status

### Fully Implemented ✅

#### Backend
- ✅ User authentication (register, login, refresh tokens)
- ✅ JWT token management with access/refresh tokens
- ✅ Trip CRUD operations (create, read, update)
- ✅ Trip member management and invitations
- ✅ Message creation and retrieval
- ✅ Conflict creation and voting system
- ✅ Plan versioning (create, read, list versions)
- ✅ Trip memory storage and updates
- ✅ LangGraph workflow orchestration
- ✅ OpenAI intent parsing (structured JSON extraction)
- ✅ Task planning with dependencies and priorities
- ✅ Response synthesis using OpenAI
- ✅ MongoDB database integration
- ✅ API documentation (Swagger/ReDoc)
- ✅ CORS configuration
- ✅ Error handling and validation

#### Frontend
- ✅ User registration and login UI
- ✅ Protected routes with authentication guards
- ✅ Trip listing page with search and filters
- ✅ Trip creation interface
- ✅ Trip planner main interface
- ✅ Chat panel for messages
- ✅ Memory and plan viewing panels
- ✅ Conflict voting UI
- ✅ Authentication context and state management
- ✅ API service layer (auth, trips, messages, conflicts, plan, memory)
- ✅ Centralized API client with token management
- ✅ Automatic token refresh on 401 errors
- ✅ Error handling and user feedback
- ✅ Responsive design with Tailwind CSS
- ✅ Animations with Framer Motion

### Partially Implemented ⚠️

#### Backend
- ⚠️ **Agent Tool Execution**: Framework exists but all tools return "not_implemented"
  - Task planning and orchestration: ✅ Complete
  - Tool execution: ❌ Placeholder only
  - Tool integrations: ❌ Not connected to real APIs

#### Frontend
- ⚠️ **Agent Integration**: Backend endpoint exists but not wired to chat UI
  - Agent endpoint: ✅ Available at `/agents/plan`
  - Chat integration: ❌ Not calling agent endpoint
  - Agent response display: ❌ Not rendering agent responses
  - Clarification handling: ❌ Not implemented

### Not Implemented ❌

#### Backend
- ❌ Real-time updates (WebSocket)
- ❌ File/image upload functionality
- ❌ Email notifications
- ❌ User profile management
- ❌ Password reset functionality
- ❌ Trip sharing via public links
- ❌ Advanced search and filtering
- ❌ Analytics and usage tracking
- ❌ Rate limiting
- ❌ Caching layer
- ❌ Background job processing
- ❌ Export functionality (PDF, JSON)

#### Frontend
- ❌ Real-time message updates
- ❌ Image upload for trip covers
- ❌ User profile pages
- ❌ Password reset UI
- ❌ Trip sharing interface
- ❌ Advanced filtering UI
- ❌ Export/download functionality
- ❌ Mobile app (React Native)
- ❌ Offline support
- ❌ Push notifications

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Shadcn UI** - Component library

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Uvicorn** - ASGI server
- **LangGraph** - Agent workflow orchestration
- **OpenAI** - AI model integration

## 📁 Project Structure

```
NomadSync/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── agents/         # LangGraph agent workflow
│   │   │   ├── __init__.py
│   │   │   └── langgraph_workflow.py  # Main agent workflow
│   │   ├── models/         # Pydantic models
│   │   │   ├── user.py
│   │   │   ├── trip.py
│   │   │   ├── message.py
│   │   │   ├── conflict.py
│   │   │   ├── plan.py
│   │   │   └── memory.py
│   │   ├── routers/        # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── trips.py
│   │   │   ├── messages.py
│   │   │   ├── conflicts.py
│   │   │   ├── plan.py
│   │   │   ├── memory.py
│   │   │   └── agent.py    # Agent workflow endpoint
│   │   ├── utils/          # Utility functions
│   │   │   ├── auth.py     # JWT and password hashing
│   │   │   └── trip_permissions.py
│   │   ├── config.py       # Configuration and settings
│   │   ├── database.py     # MongoDB connection
│   │   └── main.py         # FastAPI app entry point
│   ├── requirements.txt    # Python dependencies
│   └── run.sh              # Server startup script
├── src/                    # React frontend
│   ├── components/         # React components
│   │   ├── LoginPage.tsx
│   │   ├── TripsPage.tsx
│   │   ├── TripPlanner.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── MemoryPlanPanel.tsx
│   │   ├── TripSidebar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ui/             # Shadcn UI components
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── services/           # API service layer
│   │   ├── auth.ts
│   │   ├── trips.ts
│   │   ├── messages.ts
│   │   ├── conflicts.ts
│   │   ├── plan.ts
│   │   └── memory.ts
│   ├── lib/                # Utilities
│   │   ├── api.ts          # Centralized API client
│   │   └── auth-tokens.ts  # Token storage helpers
│   ├── styles/             # Global styles
│   │   └── globals.css
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── package.json            # Node dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12+ (3.11 also works, avoid 3.14 due to Pydantic compatibility)
- **MongoDB** (local installation or Docker)
- **OpenAI API Key** (for AI agent features, optional)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd NomadSync
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment (use Python 3.11 or 3.12)
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**Python Version Note**: Python 3.14 is very new and some packages may not have full support yet. If you encounter build errors (especially with `pydantic-core`), use **Python 3.11 or 3.12** which are more stable and widely supported.

#### 3. MongoDB Setup

**Option A: Docker (Recommended)**
```bash
docker run -d -p 27017:27017 mongo
```

**Option B: Local Installation**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Or use MongoDB Atlas (cloud)
```

#### 4. Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nomadsync
JWT_SECRET=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Optional: For AI agent features
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4.1-mini
```

#### 5. Frontend Setup

```bash
# From project root
npm install
```

Create a `.env` file in the project root (optional):

```env
VITE_API_URL=http://localhost:8000
```

## 🏃 Running the Application

### Start Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`
- API Docs (Swagger): `http://localhost:8000/docs`
- API Docs (ReDoc): `http://localhost:8000/redoc`

### Start Frontend

```bash
# From project root
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user ✅
- `POST /auth/login` - Login (returns access + refresh tokens) ✅
- `POST /auth/refresh` - Refresh access token ✅
- `GET /auth/me` - Get current user info ✅

### Trips
- `GET /trips` - List user's trips ✅
- `POST /trips` - Create new trip ✅
- `GET /trips/{trip_id}` - Get trip details ✅
- `PATCH /trips/{trip_id}` - Update trip ✅
- `POST /trips/{trip_id}/invite` - Invite member to trip ✅
- `DELETE /trips/{trip_id}` - Delete trip ❌
- `GET /trips/{trip_id}/members` - List trip members ❌
- `DELETE /trips/{trip_id}/members/{user_id}` - Remove member ❌

### Messages
- `GET /trips/{trip_id}/messages` - Get messages for a trip ✅
- `POST /trips/{trip_id}/messages` - Create new message ✅
- `DELETE /trips/{trip_id}/messages/{message_id}` - Delete message ❌
- `PATCH /trips/{trip_id}/messages/{message_id}` - Edit message ❌

### Conflicts
- `POST /trips/{trip_id}/conflicts` - Create conflict ✅
- `POST /trips/{trip_id}/conflicts/{conflict_id}/vote` - Vote on conflict option ✅
- `GET /trips/{trip_id}/conflicts/{conflict_id}` - Get conflict details ✅
- `GET /trips/{trip_id}/conflicts` - List all conflicts ❌
- `DELETE /trips/{trip_id}/conflicts/{conflict_id}` - Resolve/delete conflict ❌

### Plan
- `GET /trips/{trip_id}/plan` - Get plan (latest or specific version) ✅
- `POST /trips/{trip_id}/plan` - Create new plan version ✅
- `GET /trips/{trip_id}/plan/versions` - List all plan versions ✅
- `DELETE /trips/{trip_id}/plan/versions/{version_id}` - Delete plan version ❌

### Memory
- `GET /trips/{trip_id}/memory` - Get trip memory ✅
- `PATCH /trips/{trip_id}/memory` - Update trip memory ✅

### Agents
- `POST /agents/plan` - Run LangGraph agent workflow for trip planning ✅ (backend only, not integrated in frontend)

**Note**: Most endpoints require authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## 🤖 LangGraph Agent Workflow

NomadSync includes a LangGraph-powered workflow for agentic trip planning. The workflow parses intent, plans tasks, requests critical clarifications, executes tasks, and synthesizes a response. It uses the OpenAI API for structured parsing and response synthesis.

### Workflow Architecture

The agent follows this workflow:

1. **Parse Intent** → Extract structured trip details from user message
2. **Create Task Plan** → Generate ordered task list with dependencies
3. **Check Clarification** → Determine if critical info is missing
4. **Execute Task Plan** → Run tools in priority order (if no clarification needed)
5. **Synthesize Response** → Generate natural language response

### Tool Definitions

The agent defines 5 tool actions (currently all return "not_implemented"):

#### 1. Flight Search (`search_flights`)
- **Status**: ❌ Not implemented (placeholder only)
- **Parameters**: `origin`, `destination`, `departure_date`, `return_date`, `passengers`
- **Priority**: 1
- **Dependencies**: None
- **Suggested APIs**: Amadeus, Skyscanner, Google Flights API

#### 2. Hotel Search (`search_hotels`)
- **Status**: ❌ Not implemented (placeholder only)
- **Parameters**: `destination`, `checkin`, `checkout`, `guests`, `rooms`
- **Priority**: 1
- **Dependencies**: None
- **Suggested APIs**: Booking.com API, Hotels.com API, Expedia API

#### 3. Weather Forecast (`get_weather_forecast`)
- **Status**: ❌ Not implemented (placeholder only)
- **Parameters**: `destination`, `start_date`, `end_date`
- **Priority**: 1
- **Dependencies**: None (but `search_attractions` depends on it)
- **Suggested APIs**: OpenWeatherMap, WeatherAPI, AccuWeather

#### 4. Attraction Search (`search_attractions`)
- **Status**: ❌ Not implemented (placeholder only)
- **Parameters**: `destination`, `interests`, `days`
- **Priority**: 2
- **Dependencies**: `get_weather` (needs weather data first)
- **Suggested APIs**: Google Places API, TripAdvisor API, Yelp API

#### 5. Day Plan Creation (`create_day_plan`)
- **Status**: ❌ Not implemented (placeholder only)
- **Parameters**: `day_number`, `destination`, `date`
- **Priority**: 3
- **Dependencies**: `search_attractions` (needs attractions first)
- **Implementation**: Should use AI to create daily itinerary from attractions

### Current Implementation

**What Works:**
- ✅ Intent parsing with OpenAI structured output
- ✅ Task planning with priority and dependency resolution
- ✅ Clarification detection and messaging
- ✅ Workflow orchestration with LangGraph
- ✅ Response synthesis with OpenAI

**What's Missing:**
- ❌ All tool implementations (all return "not_implemented")
- ❌ Frontend integration (agent endpoint not called from chat)
- ❌ Real-time agent response streaming
- ❌ Memory persistence after agent runs
- ❌ Error handling for tool failures
- ❌ Tool result caching

### Setup

1. **Install dependencies** (already listed in `backend/requirements.txt`):
```bash
pip install -r backend/requirements.txt
```

2. **Configure environment variables** in `backend/.env`:
```env
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4.1-mini
```

### API Endpoint

`POST /agents/plan`

**Request body:**
```json
{
  "message": "Plan my trip from Tempe to SF Jan 12-14 for 4 people.",
  "trip_context": {},
  "trip_memory": {
    "group_size": 4
  }
}
```

**Response shape:**
```json
{
  "clarification": null,
  "response": "Natural-language response from the agent.",
  "intent": { "destinations": ["San Francisco"], "...": "..." },
  "task_plan": { "tasks": [ "..." ] },
  "completed_tasks": { "search_flights": { "status": "not_implemented" } }
}
```

### Implementation Location

Tool execution happens in `backend/app/agents/langgraph_workflow.py`:

```python
async def execute_single_task(task: TaskPlan.Task, context: Dict[str, Any]) -> Any:
    # TODO: Implement actual tool calls
    # Currently returns placeholder for all tools
    return {
        "status": "not_implemented",
        "message": "Connect this action to a provider or internal service."
    }
```

## 🏗️ Architecture

### Backend Architecture

#### Request Flow
1. Client sends HTTP request → FastAPI router
2. Router validates request → Pydantic models
3. Router checks authentication → JWT token validation
4. Router checks permissions → Trip access validation
5. Router executes business logic → Database operations
6. Router returns response → JSON serialization

#### Authentication Flow
1. User registers/logs in → Backend validates credentials
2. Backend generates JWT tokens → Access token (short-lived) + Refresh token (long-lived)
3. Tokens returned to client → Stored in localStorage
4. Subsequent requests include token → `Authorization: Bearer <token>` header
5. Token expires → Client uses refresh token to get new access token

#### Database Layer
- **Motor** (async MongoDB driver) for database operations
- **Pydantic** models for data validation and serialization
- **ObjectId** conversion for MongoDB document IDs
- Collections: `users`, `trips`, `messages`, `conflicts`, `plan_versions`, `trip_memory`

### Frontend Architecture

#### Component Hierarchy
```
App
├── AuthProvider (Context)
│   └── Router
│       ├── LoginPage
│       └── ProtectedRoute
│           ├── TripsPage
│           └── TripPlanner
│               ├── TripSidebar
│               ├── ChatPanel
│               └── MemoryPlanPanel
```

#### State Management
- **AuthContext**: Global authentication state
- **Component State**: Local state with React hooks
- **API Service Layer**: Abstraction over HTTP requests
- **Token Storage**: localStorage via `auth-tokens.ts`

#### Data Flow

**Trips Page:**
1. Component mounts → `useEffect` triggers
2. Calls `tripsService.getAll()` → API request
3. API client adds auth token → Automatic header injection
4. Backend validates and returns data → JSON response
5. Component updates state → UI re-renders

**Trip Planner:**
1. Component mounts with trip ID → `useParams` hook
2. Parallel data fetching → `Promise.all([messages, memory, plan])`
3. Data loaded → State updated
4. User sends message → `messagesService.create()`
5. Message added to local state → Optimistic update
6. TODO: Trigger agent → Not yet implemented

**Error Handling:**
- API errors caught in try/catch blocks
- 401 errors trigger token refresh or logout
- User-friendly error messages displayed
- Network errors show retry options

## 🗄️ Database Schema

### Collections

#### users
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  hashed_password: String,
  name: String (optional),
  avatar_emoji: String (optional),
  created_at: DateTime,
  updated_at: DateTime
}
```

#### trips
```javascript
{
  _id: ObjectId,
  title: String,
  destination: String (optional),
  dates: {
    start: DateTime (optional),
    end: DateTime (optional)
  },
  status: String ("draft" | "planned" | "completed"),
  members: [{
    userId: ObjectId,
    role: String ("owner" | "member"),
    joinedAt: DateTime
  }],
  created_by: ObjectId (ref: users),
  created_at: DateTime,
  updated_at: DateTime
}
```

#### messages
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: trips),
  authorId: ObjectId (ref: users, optional),
  type: String ("human" | "agent" | "conflict"),
  content: String,
  summary: String (optional),
  questions: [String] (optional),
  conflictId: ObjectId (ref: conflicts, optional),
  hasViewPlan: Boolean,
  createdAt: DateTime
}
```

#### conflicts
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: trips),
  question: String,
  options: [{
    key: String,
    label: String,
    votes: [ObjectId] (ref: users)
  }],
  created_by: ObjectId (ref: users),
  created_at: DateTime,
  resolved_at: DateTime (optional)
}
```

#### plan_versions
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: trips),
  version: Number,
  itinerary: Object (flexible structure),
  created_by: String ("agent" | userId),
  created_at: DateTime
}
```

#### trip_memory
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: trips, unique),
  preferences: Object (flexible structure),
  decisions: [Object],
  extracted_at: DateTime,
  updated_at: DateTime
}
```

## ❌ Missing Features & Future Implementations

### High Priority 🔴

#### 1. Agent Tool Implementations
**Status**: Framework complete, implementations missing

**Required:**
- [ ] Flight search API integration (Amadeus/Skyscanner)
- [ ] Hotel search API integration (Booking.com/Expedia)
- [ ] Weather API integration (OpenWeatherMap)
- [ ] Attractions API integration (Google Places/TripAdvisor)
- [ ] Day plan generation using AI from attractions
- [ ] Error handling for API failures
- [ ] Rate limiting for external APIs
- [ ] Caching for API responses

**Implementation Location**: `backend/app/agents/langgraph_workflow.py` → `execute_single_task()`

#### 2. Frontend Agent Integration
**Status**: Backend ready, frontend not connected

**Required:**
- [ ] Call `/agents/plan` from chat UI when user sends message
- [ ] Display agent responses in chat
- [ ] Handle clarification requests from agent
- [ ] Show agent thinking/loading state
- [ ] Persist agent responses to messages
- [ ] Update trip memory after agent runs
- [ ] Stream agent responses (if supported)

**Implementation Location**: `src/components/TripPlanner.tsx` → `handleSendMessage()`

#### 3. Real-Time Updates
**Status**: Not implemented

**Required:**
- [ ] WebSocket server setup (FastAPI WebSocket)
- [ ] WebSocket client in React
- [ ] Real-time message updates
- [ ] Real-time conflict vote updates
- [ ] Presence indicators (who's online)
- [ ] Typing indicators

**Suggested Stack**: FastAPI WebSocket + Socket.io or native WebSocket

### Medium Priority 🟡

#### 4. File Upload
**Status**: Not implemented

**Required:**
- [ ] Image upload endpoint (trip covers, user avatars)
- [ ] File storage (local/S3/Cloudinary)
- [ ] Image optimization and resizing
- [ ] Frontend upload UI
- [ ] Progress indicators

#### 5. User Profiles
**Status**: Basic user model exists, profile features missing

**Required:**
- [ ] User profile page
- [ ] Avatar upload and display
- [ ] Profile editing
- [ ] User preferences
- [ ] Activity history

#### 6. Password Reset
**Status**: Not implemented

**Required:**
- [ ] Password reset request endpoint
- [ ] Email sending (SMTP/SendGrid)
- [ ] Reset token generation
- [ ] Password reset UI
- [ ] Token expiration handling

#### 7. Trip Sharing
**Status**: Not implemented

**Required:**
- [ ] Public trip link generation
- [ ] Shareable link with read-only access
- [ ] Link expiration
- [ ] Share UI component
- [ ] Access control for shared trips

#### 8. Advanced Search & Filtering
**Status**: Basic trip listing exists

**Required:**
- [ ] Full-text search for trips
- [ ] Advanced filters (date range, status, members)
- [ ] Sorting options
- [ ] Pagination
- [ ] Search UI components

### Low Priority 🟢

#### 9. Email Notifications
**Status**: Not implemented

**Required:**
- [ ] Email service integration
- [ ] Notification preferences
- [ ] Trip invitation emails
- [ ] Message notification emails
- [ ] Conflict resolution notifications

#### 10. Export Functionality
**Status**: Not implemented

**Required:**
- [ ] PDF export for trip plans
- [ ] JSON export for trip data
- [ ] Calendar export (iCal)
- [ ] Export UI

#### 11. Analytics & Tracking
**Status**: Not implemented

**Required:**
- [ ] Usage analytics
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User behavior tracking

#### 12. Mobile App
**Status**: Not implemented

**Required:**
- [ ] React Native app
- [ ] Mobile-optimized UI
- [ ] Push notifications
- [ ] Offline support
- [ ] App store deployment

### Technical Debt 🔧

#### 13. Testing
**Status**: Not implemented

**Required:**
- [ ] Unit tests for backend (pytest)
- [ ] Integration tests for API
- [ ] Frontend component tests (React Testing Library)
- [ ] E2E tests (Playwright/Cypress)
- [ ] CI/CD pipeline

#### 14. Performance Optimization
**Status**: Basic implementation

**Required:**
- [ ] Database query optimization
- [ ] API response caching (Redis)
- [ ] Frontend code splitting
- [ ] Image lazy loading
- [ ] API rate limiting

#### 15. Security Enhancements
**Status**: Basic security implemented

**Required:**
- [ ] Rate limiting per user/IP
- [ ] Input sanitization
- [ ] SQL injection prevention (already using parameterized queries)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Security headers
- [ ] Audit logging

#### 16. Documentation
**Status**: Basic README exists

**Required:**
- [ ] API documentation improvements
- [ ] Architecture diagrams
- [ ] Deployment guides
- [ ] Contributing guidelines
- [ ] Code comments and docstrings

## 🔐 Authentication Flow

1. User registers/logs in via the frontend
2. Backend validates credentials and returns JWT tokens
3. Tokens are stored in localStorage
4. All API requests include the token in the Authorization header
5. Tokens are automatically refreshed when expired

## 🔧 Development

### Backend Development

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The `--reload` flag enables auto-reload on code changes.

### Frontend Development

```bash
npm run dev
```

Vite provides hot module replacement for instant updates.

### Building for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
The backend runs directly with uvicorn. For production, consider:
- Using a process manager (PM2, supervisor)
- Setting up reverse proxy (Nginx)
- Using production ASGI server (Gunicorn with uvicorn workers)

## 🐛 Troubleshooting

### Backend Issues

#### Pydantic Build Errors
If you encounter errors building `pydantic-core`:

1. **Use Python 3.11 or 3.12** (most reliable solution)
   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Install pre-built wheels:**
   ```bash
   pip install --only-binary :all: -r requirements.txt
   ```

3. **Update pip and setuptools:**
   ```bash
   pip install --upgrade pip setuptools wheel
   ```

#### MongoDB Connection Errors
Make sure MongoDB is running:
```bash
# Check if MongoDB is running (macOS)
brew services list | grep mongodb

# Start if not running
brew services start mongodb-community

# Or check Docker container
docker ps | grep mongo
```

#### Bcrypt Version Warning
This should be resolved with `bcrypt<5.0.0` in requirements.txt. If you see warnings, ensure you're using the pinned version.

### Frontend Issues

1. **API connection errors**: Ensure backend is running on port 8000
2. **CORS errors**: Backend CORS is configured for `http://localhost:5173`
3. **Token errors**: Clear localStorage and re-login

## 📝 Environment Variables

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017`)
- `MONGODB_DB_NAME` - Database name (default: `nomadsync`)
- `JWT_SECRET` - Secret key for JWT signing (change in production!)
- `JWT_ALGORITHM` - JWT algorithm (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Access token expiry (default: `30`)
- `REFRESH_TOKEN_EXPIRE_DAYS` - Refresh token expiry (default: `7`)
- `OPENAI_API_KEY` - OpenAI API key for agent features (optional)
- `OPENAI_MODEL` - OpenAI model to use (default: `gpt-4.1-mini`)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: `http://localhost:8000`)

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. For questions or issues, please contact the maintainers.

---

Built with ❤️ using React, FastAPI, and MongoDB
