# NomadSync - Collaborative Travel Planner

A modern, AI-powered collaborative travel planning application that helps groups plan trips together. Built with React, FastAPI, and MongoDB.

![NomadSync](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.128.0-009688?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-4.16.0-47A248?logo=mongodb)

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
│   │   ├── models/         # Pydantic models
│   │   ├── routers/        # API route handlers
│   │   ├── utils/          # Utility functions
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # MongoDB connection
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt    # Python dependencies
│   └── run.sh              # Server startup script
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── services/           # API service layer
│   ├── lib/                # Utilities (API client)
│   └── styles/             # Global styles
├── package.json            # Node dependencies
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
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns access + refresh tokens)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

### Trips
- `GET /trips` - List user's trips
- `POST /trips` - Create new trip
- `GET /trips/{trip_id}` - Get trip details
- `PATCH /trips/{trip_id}` - Update trip
- `POST /trips/{trip_id}/invite` - Invite member to trip

### Messages
- `GET /trips/{trip_id}/messages` - Get messages for a trip
- `POST /trips/{trip_id}/messages` - Create new message

### Conflicts
- `POST /trips/{trip_id}/conflicts` - Create conflict
- `POST /trips/{trip_id}/conflicts/{conflict_id}/vote` - Vote on conflict option
- `GET /trips/{trip_id}/conflicts/{conflict_id}` - Get conflict details

### Plan
- `GET /trips/{trip_id}/plan` - Get plan (latest or specific version)
- `POST /trips/{trip_id}/plan` - Create new plan version
- `GET /trips/{trip_id}/plan/versions` - List all plan versions

### Memory
- `GET /trips/{trip_id}/memory` - Get trip memory
- `PATCH /trips/{trip_id}/memory` - Update trip memory

### Agents
- `POST /agents/plan` - Run LangGraph agent workflow for trip planning

**Note**: Most endpoints require authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## 🤖 LangGraph Agent Workflow

NomadSync includes a LangGraph-powered workflow for agentic trip planning. The workflow parses intent, plans tasks, requests critical clarifications, executes tasks, and synthesizes a response. It uses the OpenAI API for structured parsing and response synthesis.

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

### Extending the Agent

- **Tool integrations**: Replace the placeholders in `backend/app/agents/langgraph_workflow.py` (`execute_single_task`) with calls to real providers (flight search, hotels, weather, etc.).
- **Memory persistence**: Pipe `trip_memory` from the `/memory` endpoints into the agent request, then write back updates after the agent completes.
- **Frontend wiring**: Call `/agents/plan` from the chat UI and render `clarification` immediately when present. Persist `response` into `/messages`.

## 🔐 Authentication Flow

1. User registers/logs in via the frontend
2. Backend validates credentials and returns JWT tokens
3. Tokens are stored in localStorage
4. All API requests include the token in the Authorization header
5. Tokens are automatically refreshed when expired

## 🗄️ Database Schema

MongoDB collections:

- **users** - User accounts with email, hashed password, name
- **trips** - Trip documents with title, destination, dates, members
- **messages** - Chat messages with type (human/agent), content, timestamp
- **conflicts** - Conflict resolution with options and votes
- **plan_versions** - Versioned trip plans with itinerary
- **trip_memory** - AI-extracted trip preferences and decisions

## 🎨 Frontend Architecture

### Components
- **LoginPage** - Authentication UI
- **TripsPage** - Trip listing and creation
- **TripPlanner** - Main planning interface
- **ChatPanel** - Message display and input
- **MemoryPlanPanel** - Memory and plan views
- **TripSidebar** - Navigation sidebar
- **ProtectedRoute** - Route guard for authentication

### Architecture

#### API Client (`src/lib/api.ts`)
- Centralized HTTP client with automatic token management
- Handles authentication headers
- Manages token storage in localStorage
- Base URL configurable via `VITE_API_URL` environment variable

#### Service Layer (`src/services/`)
- **auth.ts**: Authentication (login, register, refresh token)
- **trips.ts**: Trip CRUD operations
- **messages.ts**: Chat message operations
- **conflicts.ts**: Conflict resolution and voting
- **plan.ts**: Trip plan versioning
- **memory.ts**: AI-extracted trip memory

#### Authentication Context (`src/contexts/AuthContext.tsx`)
- Provides authentication state throughout the app
- Manages user session
- Handles login/logout
- Protected routes check authentication status

### Data Flow

#### Trips Page
- Fetches trips on mount: `tripsService.getAll()`
- Creates new trip: `tripsService.create()`
- Displays trip cards with real data from API

#### Trip Planner
- Loads trip data on mount:
  - Messages: `messagesService.getByTrip(tripId)`
  - Memory: `memoryService.get(tripId)`
  - Plan: `planService.get(tripId)`
- Sends messages: `messagesService.create(tripId, data)`
- Updates memory/plan as user interacts

#### Error Handling
- API errors are caught and displayed to users
- 401 errors automatically clear tokens and redirect to login
- Network errors show user-friendly messages

#### Token Management
- Access tokens stored in localStorage
- Refresh tokens used to get new access tokens
- Tokens automatically included in API requests
- Logout clears all tokens

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

## 🚧 Roadmap

- [ ] Real-time message updates (WebSocket)
- [ ] Complete agent integration in chat UI
- [ ] Tool integrations for flights, hotels, weather APIs
- [ ] Image upload for trip covers
- [ ] User avatars and profiles
- [ ] Email notifications
- [ ] Trip sharing via links
- [ ] Mobile app (React Native)
- [ ] Advanced conflict resolution features

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. For questions or issues, please contact the maintainers.

---

Built with ❤️ using React, FastAPI, and MongoDB
