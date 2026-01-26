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
- **Dynamic Tooling System**: Flexible, extensible tool registry for agent capabilities
- **Flight Search & Booking**: Integrated Amadeus API for real-time flight search and booking
- **Smart Airport Resolution**: Dynamic airport code lookup using Google Places API and Amadeus API
- **Flight UI Cards**: Beautiful flight card components displaying structured flight data
- **Google Places Integration**: Dynamic location and airport lookup using Google Places API
- **Agent Workflow**: LangGraph-powered AI agent with dynamic task planning
- **Real-time Collaboration**: SSE (Server-Sent Events) for live updates to messages, plans, and votes
- **Plan Version History**: Timeline view of all plan versions with creation metadata
- **Plan Diff View**: Visual comparison showing changes between plan versions
- **Plan Rollback**: Restore previous plan versions with one click
- **Agent-Plan Linking**: Agent messages automatically linked to generated plan versions

### 🚧 In Progress

- **Memory Auto-updates**: Automatic trip memory updates from conversations
- **Additional Tool Integrations**: Hotels, weather, attractions

### 📋 Planned

- **External API Integrations**: 
  - Hotel booking (Booking.com, Expedia)
  - Weather forecasts (OpenWeatherMap)
  - Attractions and activities research (Google Places, TripAdvisor)
  - Restaurant recommendations
  - Route optimization
- **Advanced Plan Features**: 
  - Lock plans to prevent changes
  - Compare plan versions side-by-side
  - Regenerate plans with specific changes
- **Enhanced Conflict UI**: 
  - Full conflict details and resolution flow
  - Conflict history and analytics
- **Real-time Updates**: 
  - WebSocket upgrade (SSE is implemented)
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
- **Express.js** - Fast, unopinionated Node.js web framework
- **MongoDB** (native driver) - Async MongoDB driver
- **LangGraph** - AI agent workflow orchestration (TypeScript implementation)
- **OpenAI API** - LLM integration for AI agent
- **Amadeus API** - Flight search and booking integration
- **Google Places API** - Dynamic airport and location lookup
- **JWT** (jsonwebtoken) - Token-based authentication
- **Zod** - TypeScript-first schema validation
- **TypeScript** - Type-safe JavaScript

### Infrastructure
- **Docker** and **Docker Compose** - Containerization
- **Nginx** - Reverse proxy and static file serving
- **MongoDB** - NoSQL database

## 🚀 Quick Start

### Prerequisites

- **Docker and Docker Compose** (recommended)
  - Docker Desktop: https://www.docker.com/products/docker-desktop
  - Or Docker Engine + Docker Compose
- **Node.js 20+** (for local development)
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

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Create .env file**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and configure:
   # - MONGODB_URI=mongodb://localhost:27017
   # - JWT_SECRET (generate with: openssl rand -hex 32)
   # - OPENAI_API_KEY (required for agent features)
   # - AMADEUS_API_KEY (required for flight search)
   # - AMADEUS_API_SECRET (required for flight search)
   # - GOOGLE_PLACES_API_KEY (required for airport/location lookup)
   # - CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. **Start MongoDB** (if not using Docker)
   ```bash
   # Using Docker (easiest)
   docker run -d -p 27017:27017 --name mongodb mongo:7
   
   # Or install MongoDB locally
   # macOS: brew install mongodb-community
   # Ubuntu: apt-get install mongodb
   ```

5. **Run the backend**
   ```bash
   cd backend
   npm run dev
   ```

   The API will be available at http://localhost:8000

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
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

#### Quick Start Script

Alternatively, use the provided startup script:

```bash
# From project root
./start-dev.sh
```

This script will:
- Check and start MongoDB (via Docker if available)
- Install dependencies if needed
- Start both backend and frontend servers
- Show combined logs

## 📖 Usage Guide

### Creating Your First Trip

1. **Register/Login**: Create an account or login at the home page
2. **Create Trip**: Click "New Trip" button on the trips dashboard
3. **Start Planning**: Click on a trip to open the planner interface

### Using the Chat Interface

1. **Send Messages**: Type your trip requirements in natural language
   - Example: "I want to go to Japan for 7 days in March with a budget of $3000"
   - Example: "Find flights from New York to Tokyo on March 15th"
   - Example: "Search for flights from JFK to LAX for 2 people"
2. **View Memory**: Check the "Trip Memory" tab to see what the AI has extracted
3. **View Plans**: Switch to the "Plan" tab to see generated itineraries
4. **Flight Search**: The agent automatically searches for flights when you mention travel dates and destinations

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
- View all versions via the "History" tab in the plan panel
- Compare different versions to see what changed
- **Version History**: Browse timeline of all plan versions with creation dates and creators
- **Diff View**: See exactly what changed between versions (added/removed/modified days)
- **Rollback**: Restore any previous version with one click - creates a new version from the selected one
- **Agent Links**: Agent messages that generated plans are linked and show a "Plan Generated" badge

### Real-time Collaboration

NomadSync provides real-time updates for collaborative planning:

- **Live Message Updates**: New messages appear automatically without page refresh
- **Plan Version Notifications**: Get notified when new plan versions are created
- **Vote Updates**: See vote counts update in real-time as team members vote
- **Visual Indicators**: Connection status indicator shows when real-time updates are active
- **SSE (Server-Sent Events)**: Push-based updates for messages, plans, and votes—no polling. The backend broadcasts events when data changes.

The real-time system automatically connects when you open a trip and disconnects when you navigate away.

### Plan Version Management

#### Viewing Version History

1. **Open History Tab**: Click the "History" tab in the right panel
2. **Browse Versions**: See all plan versions in chronological order
3. **View Details**: Each version shows creation date, creator (AI or user), and version number
4. **Current Version**: The active version is highlighted in green

#### Comparing Versions

1. **Select a Version**: Click on any version in the history
2. **Compare Mode**: Click the "Compare" button or eye icon
3. **View Diff**: See visual differences:
   - **Green**: Added days/activities
   - **Red**: Removed days/activities
   - **Yellow**: Modified days with activity changes
4. **Stop Comparing**: Click "Stop Comparing" to exit comparison mode

#### Rolling Back to a Previous Version

1. **Open History**: Navigate to the History tab
2. **Select Version**: Click on the version you want to restore
3. **Rollback**: Click the rollback icon (↻) on the version card
4. **Confirm**: A new version is created from the selected version
5. **View Plan**: Automatically switches to the Plan tab to show the restored version

**Note**: Rollback creates a new version rather than deleting later versions, preserving full history.

### Flight Search & Display

The AI agent can automatically search for flights and display them as interactive flight cards:

**Examples:**
- "Find flights from New York to Tokyo on March 15th"
- "I need to fly from JFK to LAX for 2 people"
- "Search flights from Tempe Arizona to San Francisco"
- "I want to book a flight from Phoenix to SFO from feb 11th to feb 15th"

**Features:**
- **Smart Airport Resolution**: 
  - Uses Google Places API to find nearest airports dynamically
  - Cross-references with Amadeus API to get IATA codes
  - Handles city names, airport names, or airport codes
  - No hardcoded mappings - fully dynamic lookup
- **Real-time Flight Search**: Uses Amadeus API for live flight data
- **Flexible Input**: Accepts airport codes (JFK, LAX) or city names (New York, Tempe Arizona)
- **Round-trip Support**: Handles both one-way and round-trip flights
- **Flight UI Cards**: Beautiful, interactive flight cards showing:
  - Airline name and logo
  - Departure and arrival times
  - Flight dates
  - Prices with currency
  - Best value indicators
  - Return flight details (if applicable)
- **Structured Data**: Flight information is displayed as UI components, not raw text

**How it works:**
1. You mention flight requirements in chat
2. Agent extracts origin, destination, dates, and passengers
3. System uses Google Places API to find nearest airports
4. Cross-references with Amadeus API to get IATA codes
5. Searches Amadeus API for available flights
6. Formats flights for UI display using display_flights tool
7. Returns structured flight data rendered as interactive cards

### Dynamic Tooling System

The agent uses a flexible tool registry system that allows new capabilities to be added easily:

- **Self-registering Tools**: Tools automatically register when imported
- **Metadata-driven**: Each tool includes descriptions, parameters, and examples
- **LLM-aware**: Tools provide schemas for function calling
- **Extensible**: Add new tools without modifying core code

**Available Tools:**
- **Flight Search** (`research:search_flights`): Search for flights using Amadeus API
- **Flight Booking** (`booking:book_flights`): Book flights using Amadeus Flight Orders API
- **Display Flights** (`research:display_flights`): Format flight data for UI display as flight cards
- **Airport Lookup** (`research:lookup_airports`): Find nearest airports using Google Places API

See [backend/DYNAMIC_TOOLING.md](backend/DYNAMIC_TOOLING.md) for details on creating new tools.

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
  "content": "I want to visit Tokyo in March",
  "plan_version_id": "optional-plan-version-id"
}
```

**Note**: `plan_version_id` is used to link agent messages to the plan versions they generate.

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

#### List Plan Versions
```http
GET /trips/{trip_id}/plan/versions
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": "...",
    "trip_id": "...",
    "version": 3,
    "itinerary": {...},
    "created_by": "agent",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "...",
    "version": 2,
    "created_by": "user_id",
    "created_at": "2024-01-14T15:20:00Z"
  }
]
```

#### Rollback to Plan Version
```http
POST /trips/{trip_id}/plan/rollback
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "version": 2
}
```

**Response:**
```json
{
  "id": "...",
  "trip_id": "...",
  "version": 4,
  "itinerary": {...},
  "created_by": "rollback:user_id",
  "created_at": "2024-01-15T11:00:00Z"
}
```

**Note**: Rollback creates a new version (version 4 in this example) from the specified version (version 2), preserving all history.

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
POST /api/agents/plan
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Find flights from New York to Tokyo on March 15th",
  "trip_id": "optional-trip-id",
  "trip_context": {...},
  "trip_memory": {...}
}
```

**Response:**
```json
{
  "clarification": null,
  "response": "I found 10 flight options from New York to Tokyo...",
  "plan_version_id": "plan_version_id_if_generated",
  "intent": {
    "destinations": ["Tokyo"],
    "origin": "New York",
    "start_date": "2024-03-15",
    "requested_tasks": ["flights"]
  },
  "task_plan": {
    "tasks": [...]
  },
  "completed_tasks": {
    "search_flights": {
      "status": "success",
      "data": [...],
      "count": 10
    }
  }
}
```

**Note**: `plan_version_id` is returned when the agent generates a new plan version, allowing frontend to link the agent message to the plan.

**Full API Documentation**: Visit `http://localhost:8000/docs` when the backend is running for interactive API documentation with Swagger UI.

## 🏗 Architecture

### System Architecture Overview

NomadSync follows a modern full-stack architecture with a React frontend, Express.js/Node.js backend, and MongoDB database. The system supports both local development with Docker Compose and cloud deployment on Railway.

#### Docker Compose (Local Development)

```mermaid
graph TB
    subgraph "Client"
        Browser[🌐 Browser<br/>HTTP/HTTPS :80]
    end
    
    subgraph "Docker Network: nomadsync-network"
        subgraph "Frontend Service"
            Nginx[📦 Nginx<br/>Port 80]
            FrontendContainer[⚛️ React SPA<br/>- Vite Dev Server<br/>- TypeScript<br/>- Tailwind CSS]
        end
        
        subgraph "Backend Service"
            Backend[🚀 Express.js<br/>Port 8000<br/>- REST API<br/>- JWT Auth<br/>- LangGraph]
        end
        
        subgraph "Database Service"
            MongoDB[(🗄️ MongoDB<br/>Port 27017<br/>- users<br/>- trips<br/>- messages<br/>- trip_memory<br/>- plan_versions<br/>- conflicts)]
        end
    end
    
    subgraph "External Services"
        OpenAI[🤖 OpenAI API<br/>gpt-4o-mini]
    end
    
    Browser -->|"Static Files & Assets"| Nginx
    Nginx -->|"API Requests /api/*"| Backend
    Browser -->|"Direct Dev Server"| FrontendContainer
    Backend <-->|"Async Operations"| MongoDB
    Backend -->|"LLM Calls"| OpenAI
    
    style Browser fill:#e1f5ff
    style Backend fill:#00d4aa
    style MongoDB fill:#4db33d
    style OpenAI fill:#412991
```

#### Railway Deployment (Production)

```mermaid
graph TB
    subgraph "Internet / Users"
        Users[👥 Users]
    end
    
    subgraph "Railway Platform"
        subgraph "Single Service Container"
            Express[🚀 Express.js + React<br/>Port: $PORT<br/>- Node.js Server<br/>- Static File Serving<br/>- API Routes /api/*]
            
            subgraph "Routes"
                Routes1["/ → index.html<br/>Frontend SPA"]
                Routes2["/api/* → API Endpoints"]
                Routes3["/assets/* → Static Assets"]
            end
        end
    end
    
    subgraph "External Services"
        MongoDB[(🗄️ MongoDB Atlas<br/>mongodb+srv://<br/>Network: 0.0.0.0/0)]
        OpenAI[🤖 OpenAI API<br/>gpt-4o-mini]
    end
    
    Users -->|"HTTPS<br/>*.up.railway.app"| Express
    Express --> Routes1
    Express --> Routes2
    Express --> Routes3
    Express <-->|"SSL/TLS<br/>Connection String"| MongoDB
    Express -->|"API Calls"| OpenAI

    style Express fill:#00d4aa
    style MongoDB fill:#4db33d
    style OpenAI fill:#412991
    style Users fill:#e1f5ff
```

**Key Architecture Points:**
- **Single Service**: Frontend and backend served from one Express.js container
- **Same Origin**: Frontend and API share the same domain, eliminating CORS issues
- **Static Serving**: Express.js serves built React SPA from `/` route
- **API Routing**: All API endpoints prefixed with `/api/*`
- **MongoDB Atlas**: External cloud database with IP whitelisting (`0.0.0.0/0`)
- **Build Process**: Multi-stage Docker build compiles frontend before backend stage

#### Backend API Architecture

```mermaid
graph TB
    subgraph "Express.js Application"
        Main[server.ts<br/>App Initialization<br/>- CORS Middleware<br/>- DB Connection<br/>- Static File Serving]
        
        subgraph "API Routers"
            AuthRouter[auth.ts<br/>- /auth/register<br/>- /auth/login<br/>- /auth/refresh]
            TripsRouter[trips.ts<br/>- GET/POST /trips<br/>- GET/PATCH /trips/:id]
            MessagesRouter[messages.ts<br/>- GET/POST /trips/:id/messages]
            MemoryRouter[memory.ts<br/>- GET/PATCH /trips/:id/memory]
            PlanRouter[plan.ts<br/>- GET/POST /trips/:id/plan<br/>- POST /trips/:id/plan/rollback]
            ConflictsRouter[conflicts.ts<br/>- GET /trips/:id/conflicts<br/>- POST /conflicts/:id/vote]
            AgentRouter[agent.ts<br/>- POST /agents/plan]
        end
        
        subgraph "Middleware & Utils"
            JWTMiddleware[Auth Middleware<br/>- Token validation<br/>- User extraction<br/>- Permission checks]
            TripPermissions[trip_permissions.ts<br/>- Role checking<br/>- Access control]
            AuthUtils[auth.ts<br/>- Password hashing<br/>- Token generation]
        end
        
        subgraph "Models"
            UserModel[user.ts]
            TripModel[trip.ts]
            MessageModel[message.ts]
            MemoryModel[memory.ts]
            PlanModel[plan.ts]
            ConflictModel[conflict.ts]
        end
        
        subgraph "Services"
            Database[database.ts<br/>- MongoDB connection<br/>- Async operations<br/>- Connection pooling]
            LangGraphWorkflow[langgraph_workflow.ts<br/>- Agent orchestration<br/>- OpenAI integration<br/>- Task execution]
        end
    end
    
    subgraph "External Services"
        MongoDB[(MongoDB Atlas<br/>Collections:<br/>- users<br/>- trips<br/>- messages<br/>- trip_memory<br/>- plan_versions<br/>- conflicts)]
        OpenAI[OpenAI API<br/>gpt-4o-mini]
    end
    
    Main --> AuthRouter
    Main --> TripsRouter
    Main --> MessagesRouter
    Main --> MemoryRouter
    Main --> PlanRouter
    Main --> ConflictsRouter
    Main --> AgentRouter
    
    AuthRouter --> JWTMiddleware
    TripsRouter --> JWTMiddleware
    MessagesRouter --> JWTMiddleware
    MemoryRouter --> JWTMiddleware
    PlanRouter --> JWTMiddleware
    ConflictsRouter --> JWTMiddleware
    AgentRouter --> JWTMiddleware
    
    JWTMiddleware --> AuthUtils
    TripsRouter --> TripPermissions
    MessagesRouter --> TripPermissions
    
    AuthRouter --> UserModel
    TripsRouter --> TripModel
    MessagesRouter --> MessageModel
    MemoryRouter --> MemoryModel
    PlanRouter --> PlanModel
    ConflictsRouter --> ConflictModel
    
    AuthRouter --> Database
    TripsRouter --> Database
    MessagesRouter --> Database
    MemoryRouter --> Database
    PlanRouter --> Database
    ConflictsRouter --> Database
    
    Database --> MongoDB
    AgentRouter --> LangGraphWorkflow
    LangGraphWorkflow --> OpenAI
    LangGraphWorkflow --> Database
    
    style Main fill:#00d4aa
    style Database fill:#4db33d
    style LangGraphWorkflow fill:#ff6b6b
    style OpenAI fill:#412991
    style MongoDB fill:#4db33d
```

**Backend Architecture Highlights:**
- **Modular Routers**: Each domain (auth, trips, messages, etc.) has its own router module
- **Middleware Chain**: JWT authentication middleware validates all protected routes
- **Permission System**: Trip-level permissions (owner/editor/viewer) enforced via utilities
- **Zod Schemas**: Type-safe data validation and serialization
- **Async Database**: Motor (async MongoDB driver) for non-blocking operations
- **Agent Integration**: LangGraph workflow triggered via `/agents/plan` endpoint

### Database Schema

The application uses MongoDB with the following collection structure and relationships:

```mermaid
erDiagram
    USER {
        string _id PK
        string email UK
        string password_hash
        string name
        string avatar_emoji
        datetime created_at
        datetime updated_at
    }
    
    TRIP {
        string _id PK
        string title
        string destination
        object dates
        string status
        int readiness
        array members
        string cover_image
        datetime created_at
        datetime updated_at
    }
    
    MESSAGE {
        string _id PK
        string tripId FK
        string authorId FK
        string conflictId FK
        string type
        string content
        string summary
        array questions
        bool has_view_plan
        datetime created_at
    }
    
    TRIP_MEMORY {
        string _id PK
        string tripId FK
        object destination
        object dates
        object budget
        object pace
        object duration
        datetime updated_at
    }
    
    PLAN_VERSION {
        string _id PK
        string tripId FK
        int version
        object itinerary
        string created_by
        datetime created_at
    }
    
    CONFLICT {
        string _id PK
        string tripId FK
        string messageId FK
        array options
        datetime created_at
    }
    
    USER ||--o{ TRIP : "creates/owns"
    TRIP ||--o{ MESSAGE : "contains"
    TRIP ||--|| TRIP_MEMORY : "has"
    TRIP ||--o{ PLAN_VERSION : "has"
    TRIP ||--o{ CONFLICT : "has"
    MESSAGE ||--o| CONFLICT : "triggers"
    USER ||--o{ MESSAGE : "writes"
```

**Collection Details:**
- **users**: User accounts with authentication credentials
- **trips**: Trip entities with members, status, and metadata
- **messages**: Chat messages linked to trips, can reference conflicts
- **trip_memory**: Extracted trip details (destination, dates, budget) with confidence scores
- **plan_versions**: Versioned trip plans with flexible itinerary structure
- **conflicts**: Voting conflicts with options and vote tracking

### Agent Workflow (LangGraph)

The application uses LangGraph to orchestrate an AI agent workflow for processing trip planning conversations:

```mermaid
flowchart TD
    Start([User Message]) --> ParseIntent[parse_intent<br/>Extract structured data<br/>- Destinations<br/>- Dates<br/>- Budget<br/>- Group size<br/>- Requested tasks]
    
    ParseIntent --> CreateTaskPlan[create_task_plan<br/>Generate task list<br/>- Set priorities<br/>- Define dependencies<br/>- Check if clarification needed]
    
    CreateTaskPlan --> CheckClarification{check_clarification<br/>Missing critical info?}
    
    CheckClarification -->|Yes| Clarification[Return Clarification<br/>Ask user for more info]
    CheckClarification -->|No| ExecuteTasks[execute_task_plan<br/>Execute tasks in order:<br/>- Search flights<br/>- Search hotels<br/>- Get weather<br/>- Plan itinerary days]
    
    ExecuteTasks --> Synthesize[synthesize_response<br/>Generate natural language response<br/>- Format for user<br/>- Include plan highlights<br/>- Suggest next steps]
    
    Synthesize --> End([End])
    Clarification --> End
    
    style Start fill:#e1f5ff,color:#000000
    style End fill:#ffe1f5,color:#000000
    style ParseIntent fill:#fff4e1,color:#000000
    style CreateTaskPlan fill:#fff4e1,color:#000000
    style ExecuteTasks fill:#e1ffe1,color:#000000
    style Synthesize fill:#e1ffe1,color:#000000
    style CheckClarification fill:#ffe1e1,color:#000000
    style Clarification fill:#ffe1e1,color:#000000
```
<｜tool▁call▁begin｜>
run_terminal_cmd

**Workflow Details:**
1. **parse_intent**: Uses OpenAI with JSON schema to extract structured trip data from natural language
2. **create_task_plan**: Generates ordered task list based on requested actions and dependencies
3. **check_clarification**: Determines if critical information is missing before proceeding
4. **execute_task_plan**: Executes tasks in priority order (currently stubbed for future external API integrations)
5. **synthesize_response**: Generates human-readable response from task results and context

### Request Flow Diagrams

#### User Message & Agent Processing Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant CP as ChatPanel Component
    participant API as Express.js Backend
    participant DB as MongoDB
    participant LG as LangGraph Agent
    participant OAI as OpenAI API
    
    U->>CP: 1. User types message
    CP->>CP: Validate input
    
    CP->>API: 2. POST /trips/{id}/messages<br/>Authorization: Bearer token<br/>Body: {type: "human", content: "..."}
    API->>API: Validate JWT token
    API->>API: Check trip permissions
    API->>DB: Save message to MongoDB
    DB-->>API: Message saved
    API-->>CP: 201 Created
    
    CP->>API: 3. POST /agents/plan<br/>Trigger agent workflow
    API->>LG: Invoke LangGraph workflow
    
    LG->>OAI: 4a. Parse intent<br/>(Extract structured data)
    OAI-->>LG: Intent data
    
    LG->>LG: 4b. Create task plan<br/>(Generate ordered tasks)
    
    LG->>LG: 4c. Check clarification<br/>(Validate required info)
    
    alt No clarification needed
        LG->>LG: 4d. Execute tasks<br/>(Search flights, hotels, etc.)
        LG->>OAI: 4e. Synthesize response<br/>(Generate natural language)
        OAI-->>LG: Agent response
    else Clarification needed
        LG-->>API: Return clarification question
    end
    
    LG-->>API: Workflow result
    
    API->>DB: 5. Save agent message<br/>{type: "agent", content: "..."}
    DB-->>API: Saved
    
    API->>DB: 6. Update trip memory<br/>(if applicable)
    DB-->>API: Memory updated
    
    API->>DB: 7. Create/update plan version<br/>(if plan generated)
    DB-->>API: Plan version saved
    
    API-->>CP: Workflow complete
    CP->>CP: 8. Refresh UI<br/>- Update messages list<br/>- Update memory panel<br/>- Update plan panel
    CP-->>U: Display updates
```

#### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant LP as LoginPage Component
    participant API as Express.js Backend
    participant DB as MongoDB
    participant Auth as AuthContext
    
    alt Registration
        U->>LP: Fill registration form
        LP->>API: POST /auth/register<br/>Body: {email, password, name}
        API->>API: Validate input
        API->>DB: Check if user exists
        DB-->>API: User not found
        API->>API: Hash password (bcrypt)
        API->>DB: Create user document
        DB-->>API: User created
        API->>API: Generate JWT tokens<br/>(access + refresh)
        API-->>LP: 201 {access_token, refresh_token}
    else Login
        U->>LP: Enter credentials
        LP->>API: POST /auth/login<br/>Form: username, password
        API->>DB: Find user by email
        DB-->>API: User document
        API->>API: Verify password
        API->>API: Generate JWT tokens
        API-->>LP: 200 {access_token, refresh_token}
    end
    
    LP->>Auth: Store tokens in context
    Auth->>Auth: Set auth state
    Auth->>LP: Redirect to trips page
    
    Note over U,Auth: Subsequent API requests include<br/>Authorization: Bearer <access_token>
    
    alt Token Refresh
        API->>API: Access token expired
        API-->>LP: 401 Unauthorized
        LP->>API: POST /auth/refresh<br/>Authorization: Bearer <refresh_token>
        API->>API: Validate refresh token
        API->>API: Generate new access token
        API-->>LP: 200 {access_token}
        LP->>Auth: Update access token
        LP->>API: Retry original request
    end
```

#### Trip Management Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant TP as TripsPage Component
    participant TSP as TripSidebar Component
    participant API as Express.js Backend
    participant DB as MongoDB
    
    U->>TP: Load trips dashboard
    TP->>API: GET /trips<br/>Authorization: Bearer token
    API->>DB: Query user's trips<br/>(by member user_id)
    DB-->>API: Trip documents
    API-->>TP: 200 [trips array]
    TP->>U: Display trips list
    
    U->>TP: Click "New Trip"
    TP->>API: POST /trips<br/>Body: {title, destination, dates}
    API->>API: Create owner member
    API->>DB: Insert trip document
    DB-->>API: Trip created
    API-->>TP: 201 Trip object
    TP->>U: Show new trip in list
    
    U->>TP: Click trip to open
    TP->>U: Navigate to planner
    TP->>API: GET /trips/{id}<br/>GET /trips/{id}/messages<br/>GET /trips/{id}/memory<br/>GET /trips/{id}/plan
    API->>DB: Fetch trip data
    DB-->>API: Trip, messages, memory, plan
    API-->>TSP: 200 Multiple responses
    TSP->>U: Display planner with data
    
    U->>TSP: Update trip details
    TSP->>API: PATCH /trips/{id}<br/>Body: {readiness, status, ...}
    API->>DB: Update trip document
    DB-->>API: Updated
    API-->>TSP: 200 Updated trip
    TSP->>U: Refresh UI
```

### Frontend Component Architecture

```mermaid
graph TB
    subgraph "App Root"
        App[App.tsx<br/>Router & Routes]
    end
    
    subgraph "Authentication"
        LoginPage[LoginPage<br/>- Login form<br/>- Registration form<br/>- Auth state]
        AuthContext[AuthContext<br/>- Token management<br/>- Auth state<br/>- Login/Register methods]
        ProtectedRoute[ProtectedRoute<br/>- Route guard<br/>- Redirect logic]
    end
    
    subgraph "Trip Management"
        TripsPage[TripsPage<br/>- Trip list display<br/>- Create new trip<br/>- Navigation]
        TripPlanner[TripPlanner<br/>- Main planner container<br/>- State management<br/>- Data loading]
    end
    
    subgraph "Planner Components"
        TripSidebar[TripSidebar<br/>- Trip metadata<br/>- Readiness indicator<br/>- Trip status]
        ChatPanel[ChatPanel<br/>- Message display<br/>- User input<br/>- Quick replies<br/>- Conflict voting]
        MemoryPlanPanel[MemoryPlanPanel<br/>- Memory tab<br/>- Plan tab<br/>- Tab switching]
    end
    
    subgraph "Services Layer"
        AuthService[auth.ts<br/>Login/Register/Refresh]
        TripsService[trips.ts<br/>CRUD operations]
        MessagesService[messages.ts<br/>Chat messages]
        MemoryService[memory.ts<br/>Trip memory]
        PlanService[plan.ts<br/>Plan versions]
        ConflictsService[conflicts.ts<br/>Vote handling]
        AgentService[agent.ts<br/>Agent workflow]
        ApiClient[api.ts<br/>HTTP client<br/>JWT handling<br/>Error handling]
    end
    
    subgraph "UI Components"
        shadcnUI[shadcn/ui Components<br/>- Button, Card, Dialog<br/>- Input, Select, Tabs<br/>- Form, Alert, etc.]
    end
    
    App --> LoginPage
    App --> ProtectedRoute
    ProtectedRoute --> TripsPage
    ProtectedRoute --> TripPlanner
    
    LoginPage --> AuthContext
    AuthContext --> AuthService
    AuthService --> ApiClient
    
    TripsPage --> TripsService
    TripsService --> ApiClient
    
    TripPlanner --> TripSidebar
    TripPlanner --> ChatPanel
    TripPlanner --> MemoryPlanPanel
    TripPlanner --> MessagesService
    TripPlanner --> MemoryService
    TripPlanner --> PlanService
    TripPlanner --> AgentService
    
    ChatPanel --> MessagesService
    ChatPanel --> ConflictsService
    MemoryPlanPanel --> MemoryService
    MemoryPlanPanel --> PlanService
    
    MessagesService --> ApiClient
    MemoryService --> ApiClient
    PlanService --> ApiClient
    ConflictsService --> ApiClient
    AgentService --> ApiClient
    
    LoginPage --> shadcnUI
    TripsPage --> shadcnUI
    TripPlanner --> shadcnUI
    ChatPanel --> shadcnUI
    MemoryPlanPanel --> shadcnUI
    TripSidebar --> shadcnUI
    
    style App fill:#e1f5ff
    style AuthContext fill:#fff4e1
    style TripPlanner fill:#e1ffe1
    style ApiClient fill:#ffe1e1
    style shadcnUI fill:#f0e1ff
```

**Component Responsibilities:**
- **App.tsx**: Main router, route definitions, global providers
- **AuthContext**: Centralized authentication state and methods
- **TripsPage**: Trip dashboard, list view, trip creation
- **TripPlanner**: Main planner container coordinating all planner components
- **ChatPanel**: Chat interface, message rendering, user input
- **MemoryPlanPanel**: Displays extracted trip memory and plan versions
- **TripSidebar**: Trip metadata, status indicators, readiness calculation
- **Services**: API communication layer with error handling
- **ApiClient**: Base HTTP client with JWT token management

### MongoDB Schema Details

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
  "planVersionId": "plan_version_id", // Reference to plan_versions._id (if agent generated plan)
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
| `AMADEUS_API_KEY` | Amadeus API key | Required for flight search |
| `AMADEUS_API_SECRET` | Amadeus API secret | Required for flight search |
| `AMADEUS_BASE_URL` | Amadeus API base URL | `https://test.api.amadeus.com` (test) or `https://api.amadeus.com` (production) |
| `GOOGLE_PLACES_API_KEY` | Google Places API key | Required for airport/location lookup. Enable "Places API" and "Geocoding API" in Google Cloud Console |

#### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

### Docker Compose Configuration

The `docker-compose.yml` file configures three services:

- **mongodb**: MongoDB database
- **backend**: Express.js/Node.js application
- **frontend**: React application served by Nginx

All services communicate through a Docker network (`nomadsync-network`).

## 🧪 Development

### Project Structure

```
NomadSync/
├── backend/
│   ├── src/
│   │   ├── agents/          # LangGraph agent workflows
│   │   │   ├── langgraph_workflow.ts
│   │   │   └── dynamic_task_planner.ts
│   │   ├── models/          # Zod schemas and TypeScript types
│   │   │   ├── user.ts
│   │   │   ├── trip.ts
│   │   │   ├── message.ts
│   │   │   ├── memory.ts
│   │   │   ├── plan.ts
│   │   │   └── conflict.ts
│   │   ├── routers/         # Express route handlers
│   │   │   ├── auth.ts
│   │   │   ├── trips.ts
│   │   │   ├── messages.ts
│   │   │   ├── memory.ts
│   │   │   ├── plan.ts
│   │   │   ├── conflicts.ts
│   │   │   └── agent.ts
│   │   ├── services/        # Business logic and external APIs
│   │   │   ├── amadeus.ts   # Amadeus flight API client
│   │   │   ├── google_places.ts  # Google Places API client
│   │   │   ├── flight_tools.ts   # Airport code resolution utilities
│   │   │   ├── tool_registry.ts  # Dynamic tool registry
│   │   │   ├── tool_loader.ts    # Tool auto-discovery
│   │   │   ├── sse.ts            # Server-Sent Events service
│   │   │   └── tools/            # Registered tools
│   │   │       ├── flight_tool.ts
│   │   │       ├── flight_booking_tool.ts
│   │   │       ├── display_flights_tool.ts
│   │   │       └── airport_lookup_tool.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── auth.ts
│   │   │   └── trip_permissions.ts
│   │   ├── config.ts        # Configuration
│   │   ├── database.ts      # MongoDB connection
│   │   └── server.ts        # Express app
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── DYNAMIC_TOOLING.md   # Tool system documentation
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TripsPage.tsx
│   │   │   ├── TripPlanner.tsx
│   │   │   ├── TripSidebar.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MemoryPlanPanel.tsx
│   │   │   ├── PlanVersionHistory.tsx
│   │   │   ├── RealtimeIndicator.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── services/            # API service clients
│   │   │   ├── auth.ts
│   │   │   ├── trips.ts
│   │   │   ├── messages.ts
│   │   │   ├── memory.ts
│   │   │   ├── plan.ts
│   │   │   ├── conflicts.ts
│   │   │   └── agent.ts
│   │   ├── lib/                # Utilities
│   │   │   └── api.ts
│   │   ├── styles/             # CSS
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile              # Frontend Dockerfile (for docker-compose)
├── nginx.conf.template     # Nginx config template for frontend
├── railway.json            # Railway deployment config
├── .dockerignore
└── README.md
```

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

### Code Style

#### Backend
- Use **TypeScript** with strict mode
- Follow **Node.js/Express.js** best practices
- Use **ESLint** and **Prettier** for code formatting
- Maximum line length: 100 characters

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

Railway is recommended for production deployments. The application uses a **single service** that serves both the frontend (React SPA) and backend (Express.js) from one container.

#### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas**: 
   - Create a MongoDB Atlas cluster
   - **Important**: Configure Network Access to allow `0.0.0.0/0` (all IPs) since Railway uses dynamic IPs
   - Get your connection string (format: `mongodb+srv://user:pass@cluster.mongodb.net/db`)

#### Deployment Steps

**Note:** This deployment uses a **single service** that serves both frontend and backend from Express.js. The `backend/Dockerfile` builds the frontend and serves it alongside the API.

##### 1. Create Railway Service

1. **Create New Service** in Railway dashboard
2. **Connect GitHub repository** and select branch
3. **Configure Service**:
   - **Root Directory**: `/` (project root) - **Important!**
   - Railway will use `railway.json` which points to `backend/Dockerfile`
   - The Dockerfile automatically builds frontend and serves it via Express.js

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
   AMADEUS_API_KEY=your-amadeus-api-key
   AMADEUS_API_SECRET=your-amadeus-api-secret
   AMADEUS_BASE_URL=https://test.api.amadeus.com
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
│  │         Single Service (Express.js)           │     │
│  │                                               │     │
│  │  Public URL: *.railway.app                   │     │
│  │                                               │     │
│  │  - Express.js (Node.js)                     │     │
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
- **Single service deployment**: Frontend and backend served from one Express.js service
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
| `AMADEUS_API_KEY` | ✅ | Amadeus API key (for flight search) | Get from [Amadeus Developers](https://developers.amadeus.com/) |
| `AMADEUS_API_SECRET` | ✅ | Amadeus API secret | Get from [Amadeus Developers](https://developers.amadeus.com/) |
| `AMADEUS_BASE_URL` | ❌ | Amadeus API base URL | `https://test.api.amadeus.com` (test) or `https://api.amadeus.com` (production) |
| `GOOGLE_PLACES_API_KEY` | ✅ | Google Places API key (for airport/location lookup) | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Enable "Places API" and "Geocoding API" |

**Note:** `VITE_API_URL` is set to `/api` in the Dockerfile build, so no environment variable needed (frontend and backend are served from the same origin).

### Docker Production Build (Local/Private Server)

1. **Set production environment variables**
   ```bash
   export JWT_SECRET=<strong-secret>
   export OPENAI_API_KEY=<your-key>
   export AMADEUS_API_KEY=<your-key>
   export AMADEUS_API_SECRET=<your-secret>
   export GOOGLE_PLACES_API_KEY=<your-key>
   ```

2. **Build and start services**
   ```bash
   docker-compose up --build -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

### Manual Deployment

#### Backend

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Set environment variables**
   ```bash
   export MONGODB_URI=mongodb://your-mongo-host:27017
   export JWT_SECRET=<your-secret>
   # ... other variables
   ```

4. **Run with production server**
   ```bash
   npm start
   # or
   node dist/server.js
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
- **Input Validation**: All inputs are validated via Zod schemas

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
# Or use different port: PORT=8001 node dist/server.js
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
Error parsing CORS_ORIGINS environment variable
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
- Ensure Express.js serves static files from `/` route
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

### Completed (~85%)
- ✅ Core infrastructure and setup
- ✅ Authentication and authorization
- ✅ Trip CRUD operations
- ✅ Chat interface UI
- ✅ Memory and plan data models
- ✅ Conflict resolution structure
- ✅ Docker containerization
- ✅ Agent workflow integration
- ✅ Dynamic tooling system
- ✅ Flight search and booking (Amadeus API)
- ✅ Google Places API integration for dynamic airport lookup
- ✅ Flight UI cards with structured data display
- ✅ Smart airport code resolution (no hardcoded mappings)
- ✅ Dynamic task planning
- ✅ Navigation improvements
- ✅ Real-time collaboration (SSE-based)
- ✅ Plan version history and timeline
- ✅ Plan diff view and comparison
- ✅ Plan rollback functionality
- ✅ Agent message-plan linking

### In Progress (~10%)
- 🚧 Memory auto-updates
- 🚧 Additional tool integrations (hotels, weather, attractions)

### Planned (~5%)
- 📋 Advanced plan features (lock, regenerate with specific changes)
- 📋 Enhanced conflict resolution UI
- 📋 Testing suite
- 📋 Tool marketplace/plugins

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
   cd backend && npm test
   
   # Frontend
   cd frontend && npm test
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

## 📚 Additional Documentation

- **[backend/DYNAMIC_TOOLING.md](backend/DYNAMIC_TOOLING.md)** - Dynamic tooling system documentation

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/) - Fast, unopinionated Node.js web framework
- UI components from [shadcn/ui](https://ui.shadcn.com/) - Beautiful React components
- Agent workflows powered by [LangGraph](https://github.com/langchain-ai/langgraph) - AI agent orchestration
- Flight data from [Amadeus API](https://developers.amadeus.com/) - Travel industry API
- Location data from [Google Places API](https://developers.google.com/maps/documentation/places) - Dynamic airport and location lookup
- Icons from [Lucide](https://lucide.dev/) - Icon library

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/shankerram3/NomadSync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shankerram3/NomadSync/discussions)

For questions or support, please open an issue on GitHub.

---

**Note**: This project is in active development. Some features may be incomplete or subject to change. We welcome feedback and contributions!
