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

#### Docker Compose (Local Development)

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│                   (nomadsync-network)                        │
│                                                              │
│  ┌─────────────┐                                            │
│  │   Browser   │                                            │
│  │  (Client)   │                                            │
│  └──────┬──────┘                                            │
│         │ HTTP/HTTPS                                        │
│         │ Port 80                                           │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                  │
│  │      Nginx (Port 80)                 │                  │
│  │  ┌──────────────────────────────┐   │                  │
│  │  │ Static File Serving          │   │                  │
│  │  │ - React SPA                  │   │                  │
│  │  │ - Assets (JS, CSS, images)   │   │                  │
│  │  └──────────────────────────────┘   │                  │
│  │                                      │                  │
│  │  ┌──────────────────────────────┐   │                  │
│  │  │ API Proxy (commented out)    │   │                  │
│  │  │ /api → backend:8000          │   │                  │
│  │  └──────────────────────────────┘   │                  │
│  └──────────┬───────────────────────────┘                  │
│             │                                                │
│    ┌────────┴────────┬──────────────────┐                  │
│    │                 │                  │                  │
│    ▼                 ▼                  ▼                  │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐      │
│  │Frontend │  │   Backend   │  │    MongoDB       │      │
│  │(React)  │  │  (FastAPI)  │  │   (Mongo:7)      │      │
│  │         │  │  Port 8000  │  │   Port 27017     │      │
│  │ - SPA   │  │             │  │                  │      │
│  │ - Vite  │  │ - REST API  │  │ - users          │      │
│  │ - TS    │  │ - JWT Auth  │  │ - trips          │      │
│  │         │  │ - LangGraph │  │ - messages       │      │
│  └─────────┘  │ - OpenAI    │  │ - trip_memory    │      │
│               │             │  │ - plan_versions  │      │
│               └──────┬──────┘  │ - conflicts      │      │
│                      │         └──────────────────┘      │
│                      │                                    │
│                      │ OpenAI API (external)              │
│                      ▼                                    │
│              ┌─────────────────┐                         │
│              │   OpenAI API    │                         │
│              │  (gpt-4o-mini)  │                         │
│              └─────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

#### Railway Deployment (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet / Users                         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │
│   Service    │      │   Service    │
│              │      │              │
│ - Railway    │      │ - Railway    │
│   Platform   │      │   Platform   │
│ - Nginx      │      │ - FastAPI    │
│ - React SPA  │      │ - Uvicorn    │
│              │      │              │
│ Port: 80     │      │ Port: 8000   │
└──────┬───────┘      └──────┬───────┘
       │                     │
       │ VITE_API_URL        │
       │ (Backend Public URL)│
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   MongoDB       │
         │   (Railway/     │
         │    External)    │
         │                 │
         │ - users         │
         │ - trips         │
         │ - messages      │
         │ - trip_memory   │
         │ - plan_versions │
         │ - conflicts     │
         └─────────────────┘
```

**Key Differences:**
- Railway deploys frontend and backend as **separate services**
- Services don't share Docker networks
- Frontend connects to backend via **public Railway URLs**
- Set `VITE_API_URL` environment variable in Railway to backend's public URL

### Agent Workflow (LangGraph)

The application uses LangGraph to orchestrate an AI agent workflow:

```
User Message
    │
    ▼
                ┌────────────────┐
                │  parse_intent  │
                │                │
                │ - Extract      │
                │   destinations │
                │ - Extract dates│
                │ - Extract      │
                │   budget       │
                │ - Extract      │
                │   group size   │
                │ - Determine    │
                │   requested    │
                │   tasks        │
                └────────┬───────┘
                         │
                         ▼
                ┌────────────────┐
                │create_task_plan│
                │                │
                │ - Generate     │
                │   task list    │
                │ - Set priority │
                │ - Set          │
                │   dependencies │
                │ - Check if     │
                │   clarification│
                │   needed       │
                └────────┬───────┘
                         │
                         ▼
                ┌────────────────┐
                │check_clarifica │
                │     tion       │
                │                │
                │ - Check if     │
                │   more info    │
                │   needed       │
                └────────┬───────┘
                         │
              ┌──────────┴──────────┐
              │                     │
        YES ──┤                     ├─── NO
              │                     │
              ▼                     ▼
    ┌────────────────┐    ┌────────────────┐
    │      END       │    │execute_task_   │
    │                │    │     plan       │
    │ Return         │    │                │
    │ Clarification  │    │ - Search       │
    │ Question       │    │   flights      │
    └────────────────┘    │ - Search       │
                          │   hotels       │
                          │ - Get weather  │
                          │ - Plan days    │
                          └────────┬───────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │synthesize_     │
                          │   response     │
                          │                │
                          │ - Generate     │
                          │   natural      │
                          │   language     │
                          │   response     │
                          │ - Format for   │
                          │   user         │
                          └────────┬───────┘
                                   │
                                   ▼
                                  END
```

**Workflow Details:**
1. **parse_intent**: Uses OpenAI with JSON schema to extract structured trip data
2. **create_task_plan**: Generates ordered task list based on requested actions
3. **check_clarification**: Determines if critical information is missing
4. **execute_task_plan**: Executes tasks in priority order (currently stubbed for external APIs)
5. **synthesize_response**: Generates human-readable response from task results

### Request Flow

#### User Message Flow

```
           ┌──────────────┐
│    User      │
│   Browser    │
           └──────┬───────┘
                  │
       │ 1. User types message
       ▼
┌─────────────────────────────────────┐
│  React ChatPanel Component          │
│  - Captures user input              │
│  - Validates input                  │
└──────┬──────────────────────────────┘
       │
       │ 2. POST /trips/{id}/messages
       │    Headers: Authorization: Bearer <token>
       │    Body: { type: "human", content: "..." }
       ▼
┌─────────────────────────────────────┐
│  FastAPI Backend                    │
│  /routers/messages.py               │
│  - Validates JWT token              │
│  - Checks trip permissions          │
│  - Saves message to MongoDB         │
└──────┬──────────────────────────────┘
       │
       │ 3. Trigger agent workflow
       │    POST /agents/plan
       ▼
┌─────────────────────────────────────┐
│  LangGraph Workflow                 │
│  /agents/langgraph_workflow.py      │
│  - Parse intent                      │
│  - Create task plan                  │
│  - Execute tasks (if no clarification)│
│  - Synthesize response               │
└──────┬──────────────────────────────┘
       │
       │ 4. Save agent response
       │    POST /trips/{id}/messages
       │    { type: "agent", content: "..." }
       ▼
┌─────────────────────────────────────┐
│  Update Trip Memory (if applicable) │
│  /routers/memory.py                 │
│  - Extract trip details             │
│  - Update confidence scores         │
│  - Store sources                    │
└──────┬──────────────────────────────┘
       │
       │ 5. Update Plan (if generated)
       │    POST /trips/{id}/plan
       │    { version: N, itinerary: {...} }
       ▼
┌─────────────────────────────────────┐
│  Frontend Polls/Updates             │
│  - Refresh messages list            │
│  - Update memory panel              │
│  - Update plan panel                │
└─────────────────────────────────────┘
```

#### Authentication Flow

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       │ 1. POST /auth/login
       │    username=email&password=pass
       ▼
┌─────────────────────────────────────┐
│  Backend /routers/auth.py           │
│  - Validate credentials              │
│  - Check password hash               │
│  - Generate JWT tokens               │
└──────┬──────────────────────────────┘
       │
       │ 2. Return tokens
       │    { access_token, refresh_token }
       ▼
┌─────────────────────────────────────┐
│  Frontend AuthContext               │
│  - Store tokens in localStorage     │
│  - Set Authorization header         │
│  - Redirect to trips page           │
└──────┬──────────────────────────────┘
       │
       │ 3. Subsequent requests
       │    Include: Authorization: Bearer <token>
       ▼
┌─────────────────────────────────────┐
│  Backend Middleware                 │
│  - Verify JWT signature             │
│  - Check expiration                 │
│  - Extract user_id                  │
│  - Attach to request                │
└─────────────────────────────────────┘
```

### MongoDB Schema

#### Database: `nomadsync`

**Collection: `users`**
```javascript
{
  "_id": ObjectId("..."),           // Unique user ID
  "email": "user@example.com",      // Unique, indexed
  "password_hash": "$2b$12$...",    // bcrypt hashed password
  "name": "John Doe",               // Optional display name
  "avatar_emoji": "😊",             // User avatar emoji
  "created_at": ISODate("..."),     // Account creation timestamp
  "updated_at": ISODate("...")      // Last update timestamp
}
```

**Indexes:**
- `{ email: 1 }` - Unique index

**Collection: `trips`**
```javascript
{
  "_id": ObjectId("..."),           // Unique trip ID
  "title": "Japan Adventure",       // Trip title
  "destination": "Tokyo, Japan",    // Optional destination
  "dates": {                        // Optional date range
    "start": ISODate("2024-03-15"),
    "end": ISODate("2024-03-22")
  },
  "status": "draft",                // "draft" | "planned" | "booked"
  "readiness": 75,                  // 0-100 readiness score
  "cover_image": "url...",          // Optional cover image URL
  "members": [                      // Array of trip members
    {
      "userId": "user_id_1",        // Reference to users._id
      "role": "owner"               // "owner" | "editor" | "viewer"
    },
    {
      "userId": "user_id_2",
      "role": "editor"
    }
  ],
  "created_at": ISODate("..."),
  "updated_at": ISODate("...")
}
```

**Indexes:**
- `{ "members.userId": 1 }` - For finding user's trips

**Collection: `messages`**
```javascript
{
  "_id": ObjectId("..."),           // Unique message ID
  "tripId": "trip_id",              // Reference to trips._id, indexed
  "authorId": "user_id",            // Reference to users._id (null for agent)
  "type": "human",                  // "human" | "agent" | "conflict"
  "content": "I want to visit Tokyo in March",  // Message content
  "summary": "User wants Tokyo trip in March",  // Optional summary
  "questions": ["When exactly in March?"],      // Optional follow-up questions
  "has_view_plan": false,           // Whether message contains plan view action
  "conflictId": "conflict_id",      // Reference to conflicts._id (if type=conflict)
  "created_at": ISODate("...")      // Message timestamp, indexed for sorting
}
```

**Indexes:**
- `{ tripId: 1, created_at: -1 }` - For efficient message retrieval
- `{ conflictId: 1 }` - For finding conflict messages

**Collection: `trip_memory`**
```javascript
{
  "_id": ObjectId("..."),           // Unique memory ID
  "tripId": "trip_id",              // Reference to trips._id, unique index
  "destination": {                  // Optional destination memory
    "value": "Tokyo, Japan",
    "confidence": 95,               // 0-100 confidence score
    "sources": ["msg_id_1", "msg_id_2"]  // Message IDs that contributed
  },
  "dates": {                        // Optional dates memory
    "value": "March 15-22, 2024",
    "confidence": 88,
    "sources": ["msg_id_1"]
  },
  "budget": {                       // Optional budget memory
    "value": "$3000 per person",
    "confidence": 75,
    "sources": ["msg_id_3"]
  },
  "pace": {                         // Optional pace memory (fast/relaxed)
    "value": "fast-paced",
    "confidence": 80,
    "sources": ["msg_id_2"]
  },
  "duration": {                     // Optional duration memory
    "value": "7 days",
    "confidence": 90,
    "sources": ["msg_id_1"]
  },
  "updated_at": ISODate("...")      // Last memory update timestamp
}
```

**Indexes:**
- `{ tripId: 1 }` - Unique index (one memory per trip)

**Collection: `plan_versions`**
```javascript
{
  "_id": ObjectId("..."),           // Unique plan version ID
  "tripId": "trip_id",              // Reference to trips._id, indexed
  "version": 1,                     // Version number (1, 2, 3, ...)
  "itinerary": {                    // Flexible itinerary structure
    "day_1": {
      "title": "Arrival in Tokyo",
      "activities": [
        "Arrive at Narita Airport",
        "Check into hotel",
        "Evening stroll"
      ],
      "cost": 180
    },
    "day_2": { ... },
    // ... more days
    "budget": {                     // Optional budget breakdown
      "total": 1200,
      "accommodation": 400,
      "activities": 300,
      "food": 350,
      "transport": 150
    }
  },
  "created_by": "agent",            // "agent" | user_id
  "created_at": ISODate("...")      // Version creation timestamp
}
```

**Indexes:**
- `{ tripId: 1, version: -1 }` - For efficient version retrieval (latest first)
- `{ tripId: 1, created_at: -1 }` - Alternative query pattern

**Collection: `conflicts`**
```javascript
{
  "_id": ObjectId("..."),           // Unique conflict ID
  "tripId": "trip_id",              // Reference to trips._id
  "messageId": "message_id",        // Reference to messages._id
  "options": [                      // Array of conflict options
    {
      "key": "a",                   // Option identifier
      "title": "Stay in Shibuya",
      "description": "Central location, vibrant area",
      "votes": [                    // Array of votes
        {
          "userId": "user_id_1",
          "at": ISODate("...")
        },
        {
          "userId": "user_id_2",
          "at": ISODate("...")
        }
      ]
    },
    {
      "key": "b",
      "title": "Stay in Shinjuku",
      "description": "Business district, quieter",
      "votes": [
        {
          "userId": "user_id_3",
          "at": ISODate("...")
        }
      ]
    }
  ],
  "created_at": ISODate("...")      // Conflict creation timestamp
}
```

**Indexes:**
- `{ tripId: 1, created_at: -1 }` - For finding trip conflicts
- `{ messageId: 1 }` - For finding conflict by message

### Data Relationships

```
users (1) ──────< (many) trips.members
  │
  │ (1)
  │
  └─────< (many) messages.authorId

trips (1) ──────< (many) messages.tripId
  │
  │ (1)
  │
  └─────< (1) trip_memory.tripId

trips (1) ──────< (many) plan_versions.tripId

trips (1) ──────< (many) conflicts.tripId

messages (1) ────< (0 or 1) conflicts.messageId

conflicts (1) ────< (0 or many) messages.conflictId
```

### Component Structure

#### Frontend Components

```
App.tsx (Root Component)
│
├── LoginPage.tsx
│   └── Authentication UI
│       ├── Registration form
│       └── Login form (OAuth2 compatible)
│
├── ProtectedRoute.tsx
│   └── Route guard (checks authentication)
│
├── TripsPage.tsx (Dashboard)
│   ├── Trip cards grid
│   ├── Search and filter
│   ├── "New Trip" button
│   └── Trip status indicators
│
└── TripPlanner.tsx (Main Planner View)
    │
    ├── TripSidebar.tsx (Left Panel)
    │   ├── Trip info display
    │   ├── Trip dates
    │   ├── Members list
    │   ├── Readiness indicator
    │   └── Trip actions
    │
    ├── ChatPanel.tsx (Center Panel)
    │   ├── MessageList
    │   │   ├── HumanMessage (user messages)
    │   │   ├── AgentMessage (AI responses)
    │   │   └── ConflictMessage (voting UI)
    │   ├── MessageInput (text area + send button)
    │   └── Loading states
    │
    └── MemoryPlanPanel.tsx (Right Panel)
        ├── Tabs (Memory | Plan)
        │
        ├── Memory Tab
        │   ├── Destination field (with confidence)
        │   ├── Dates field (with confidence)
        │   ├── Budget field (with confidence)
        │   ├── Pace field (with confidence)
        │   └── Duration field (with confidence)
        │
        └── Plan Tab
            ├── Version selector
            ├── Budget summary
            ├── Day-by-day itinerary
            │   ├── Day title
            │   ├── Activities list
            │   └── Day cost
            └── "Compare versions" button (future)
```

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

### Railway Deployment (Recommended)

Railway is recommended for production deployments. The application uses a **single service** that serves both the frontend (React SPA) and backend (FastAPI) from one container.

#### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas**: 
   - Create a MongoDB Atlas cluster
   - **Important**: Configure Network Access to allow `0.0.0.0/0` (all IPs) since Railway uses dynamic IPs
   - Get your connection string (format: `mongodb+srv://user:pass@cluster.mongodb.net/db`)

#### Deployment Steps

**Note:** This deployment uses a **single service** that serves both frontend and backend from FastAPI. The `backend/Dockerfile` builds the frontend and serves it alongside the API.

##### 1. Create Railway Service

1. **Create New Service** in Railway dashboard
2. **Connect GitHub repository** and select branch
3. **Configure Service**:
   - **Root Directory**: `/` (project root) - **Important!**
   - Railway will use `railway.json` which points to `backend/Dockerfile`
   - The Dockerfile automatically builds frontend and serves it via FastAPI

4. **Set Environment Variables**:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   MONGODB_DB=nomadsync
   JWT_SECRET=<generate-strong-secret>
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   REFRESH_TOKEN_EXPIRE_DAYS=30
   CORS_ORIGINS=https://your-service.railway.app,http://localhost:5173
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```

5. **Configure Public Networking**:
   - Go to **Settings → Networking → Public Networking**
   - Click **Generate Service Domain**
   - Set **Target Port**: Leave blank (auto) or use the port Railway assigns via `$PORT`
   - Railway will provide a public URL like `your-service.up.railway.app`

6. **MongoDB Atlas Network Access** (if using Atlas):
   - Go to MongoDB Atlas Dashboard → **Network Access**
   - Click **Add IP Address**
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`)
   - This is required because Railway uses dynamic IP addresses

7. **Deploy**: Railway will auto-deploy on git push

#### Railway Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Railway Platform                      │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │         Single Service (FastAPI)              │     │
│  │                                               │     │
│  │  Public URL: *.railway.app                   │     │
│  │                                               │     │
│  │  - FastAPI (Uvicorn)                         │     │
│  │  - Serves React SPA (static files)           │     │
│  │  - Handles API routes (/api/*)               │     │
│  │  - Port: $PORT (Railway assigned)            │     │
│  │                                               │     │
│  │  Routes:                                     │     │
│  │  - / → Frontend (index.html)                 │     │
│  │  - /api/* → API endpoints                    │     │
│  │  - /assets/* → Static assets                 │     │
│  └───────────────┬──────────────────────────────┘     │
│                  │                                      │
│                  ▼                                      │
│         ┌──────────────────────┐                        │
│         │   MongoDB Atlas     │                        │
│         │   (External)        │                        │
│         │                      │                        │
│         │ - Network Access:    │                        │
│         │   0.0.0.0/0          │                        │
│         │ - Connection String │                        │
│         │   in env vars       │                        │
│         └──────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

**Important Notes:**
- **Single service deployment**: Frontend and backend served from one FastAPI service
- **VITE_API_URL**: Set to `/api` (same origin, no need for full URL)
- **CORS_ORIGINS**: Include your Railway domain (e.g., `https://your-service.up.railway.app`)
- **MongoDB Atlas**: Must whitelist `0.0.0.0/0` in Network Access for Railway's dynamic IPs
- **Root Directory**: Must be set to `/` (project root) in Railway settings
- **Dockerfile**: Uses `backend/Dockerfile` which builds both frontend and backend

#### Railway Environment Variables

**Service Environment Variables:**
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string (use `mongodb+srv://`) | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `MONGODB_DB` | ❌ | Database name | `nomadsync` |
| `JWT_SECRET` | ✅ | Secret for JWT tokens | `openssl rand -hex 32` |
| `JWT_ALGORITHM` | ❌ | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | Access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | ❌ | Refresh token TTL | `30` |
| `CORS_ORIGINS` | ✅ | Allowed origins (comma-separated or JSON array) | `https://your-service.up.railway.app,http://localhost:5173` |
| `OPENAI_API_KEY` | ✅ | OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | ❌ | OpenAI model | `gpt-4o-mini` |

**Note:** `VITE_API_URL` is set to `/api` in the Dockerfile build, so no environment variable needed (frontend and backend are served from the same origin).

### Docker Production Build (Local/Private Server)

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

#### Railway Deployment Issues

**Problem**: MongoDB Atlas SSL handshake failed
```
Error: SSL handshake failed: [SSL: TLSV1_ALERT_INTERNAL_ERROR]
```
**Solution**: 
1. Go to MongoDB Atlas Dashboard → **Network Access**
2. Click **Add IP Address**
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Railway uses dynamic IP addresses, so you must allow all IPs
5. Wait a few minutes for changes to propagate

**Problem**: `405 Method Not Allowed` on API calls
```
POST /api/api/auth/register HTTP/1.1" 405
```
**Solution**: 
- This indicates a double `/api` prefix
- Check that `VITE_API_URL` is set to `/api` (not `/api/api`)
- The frontend `ApiClient` should normalize endpoints automatically
- Verify in browser console that API calls use correct paths

**Problem**: `cors_origins` parsing error on startup
```
pydantic_settings.exceptions.SettingsError: error parsing value for field "cors_origins"
```
**Solution**:
- `CORS_ORIGINS` can be set as:
  - Comma-separated: `https://domain1.com,https://domain2.com`
  - JSON array: `["https://domain1.com","https://domain2.com"]`
  - Single string: `https://domain1.com`
- The validator handles all formats automatically
- Ensure no trailing commas or invalid JSON

**Problem**: Docker build fails with "not found" errors
```
failed to compute cache key: failed to calculate checksum of ref ... "/src": not found
```
**Solution**:
1. Ensure **Root Directory** in Railway is set to `/` (project root)
2. Check `.dockerignore` doesn't exclude necessary directories
3. Verify `railway.json` points to correct Dockerfile path
4. The Dockerfile should use relative paths from project root

**Problem**: Frontend not loading on Railway
**Solution**:
- Verify the Dockerfile builds frontend in the `frontend-builder` stage
- Check that static files are copied to `./static` in the backend stage
- Ensure FastAPI serves static files from `/` route
- Check Railway logs for build errors

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
