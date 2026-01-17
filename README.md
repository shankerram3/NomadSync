# NomadSync

A collaborative AI-powered travel planning application that helps groups plan trips together through natural language conversations.

## 🎯 Overview

NomadSync is a full-stack web application that combines AI agents, collaborative planning, and real-time updates to make trip planning seamless. Users can chat with an AI agent to plan trips, resolve conflicts through voting, and track trip readiness as the plan evolves.

## ✨ Features

### ✅ Implemented

- **User Authentication**: JWT-based authentication with registration and login
- **Trip Management**: Create, view, update, and manage multiple trips
- **Chat Interface**: Real-time chat with AI agent for trip planning
- **Trip Memory**: AI extracts and tracks trip details (destination, dates, budget, pace, duration) with confidence scores
- **Plan Versioning**: Multiple plan versions per trip with version history
- **Conflict Resolution**: Vote-based system for resolving planning conflicts
- **Collaborative Features**: Multi-user trip planning with member management
- **Responsive UI**: Modern, clean interface built with React and Tailwind CSS
- **Docker Support**: Full containerization for easy deployment

### 🚧 In Progress

- **Agent Workflow Integration**: Connecting LangGraph workflow to chat messages
- **Dynamic Plan Generation**: Real-time plan updates from agent responses
- **Memory Auto-updates**: Automatic trip memory updates from conversations

### 📋 Planned

- **External API Integrations**: 
  - Flight search
  - Hotel booking
  - Weather forecasts
  - Attractions and activities research
- **Real-time Updates**: WebSocket/SSE for live collaboration
- **Advanced Plan Features**: Lock plans, compare versions, regenerate with changes
- **Enhanced Conflict UI**: Full conflict details and resolution flow

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **FastAPI** (Python) for REST API
- **MongoDB** with Motor (async driver)
- **LangGraph** for AI agent workflows
- **OpenAI API** for LLM integration
- **JWT** for authentication
- **Pydantic** for data validation

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **Nginx** for frontend serving and API proxying
- **MongoDB** for data persistence

## 📁 Project Structure

```
NomadSync/
├── backend/
│   ├── app/
│   │   ├── agents/          # LangGraph agent workflows
│   │   ├── models/          # Pydantic models
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── utils/           # Utility functions
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # MongoDB connection
│   │   └── main.py          # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── ChatPanel.tsx
│   │   ├── TripPlanner.tsx
│   │   ├── TripsPage.tsx
│   │   └── ...
│   ├── contexts/            # React contexts
│   ├── services/            # API service clients
│   ├── lib/                # Utilities
│   └── App.tsx
├── docker-compose.yml
├── Dockerfile              # Frontend Dockerfile
└── nginx.conf
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- MongoDB (or use Docker)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/shankerram3/NomadSync.git
   cd NomadSync
   ```

2. **Create environment file** (optional, for custom config)
   ```bash
   # Create .env in project root
   JWT_SECRET=your-secret-key-here
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   ```

3. **Build and start services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

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
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=nomadsync
   JWT_SECRET=dev-secret-please-change
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=7
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. **Start MongoDB** (if not using Docker)
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 mongo:7
   ```

6. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

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
   VITE_API_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token

### Trips
- `GET /trips` - List all trips for user
- `POST /trips` - Create new trip
- `GET /trips/{trip_id}` - Get trip details
- `PATCH /trips/{trip_id}` - Update trip
- `DELETE /trips/{trip_id}` - Delete trip

### Messages
- `GET /trips/{trip_id}/messages` - Get trip messages
- `POST /trips/{trip_id}/messages` - Create message

### Memory
- `GET /trips/{trip_id}/memory` - Get trip memory
- `PATCH /trips/{trip_id}/memory` - Update trip memory

### Plans
- `GET /trips/{trip_id}/plan` - Get plan (latest or specific version)
- `POST /trips/{trip_id}/plan` - Create plan version
- `GET /trips/{trip_id}/plan/versions` - List plan versions

### Conflicts
- `GET /trips/{trip_id}/conflicts` - Get trip conflicts
- `POST /trips/{trip_id}/conflicts/{conflict_id}/vote` - Vote on conflict

### Agents
- `POST /agents/plan` - Run agent workflow

Full API documentation available at `/docs` when running the backend.

## 🏗 Architecture

### Agent Workflow

The application uses LangGraph to create an AI agent workflow:

1. **Parse Intent**: Extract structured trip information from user messages
2. **Create Task Plan**: Generate ordered tasks based on user intent
3. **Check Clarification**: Determine if additional information is needed
4. **Execute Tasks**: Run planned tasks (currently stubbed for external integrations)
5. **Synthesize Response**: Generate natural language response from results

### Data Flow

```
User Message → Chat Interface → Backend API → Agent Workflow
                                                      ↓
Trip Memory ← Memory Service ← Agent Response ← Task Execution
     ↓
Plan Updates → Plan Service → UI Updates
```

### Database Schema

- **users**: User accounts and authentication
- **trips**: Trip metadata and settings
- **messages**: Chat messages (human/agent/conflict)
- **trip_memory**: Extracted trip information with confidence
- **plan_versions**: Generated trip plans with versioning
- **conflicts**: Planning conflicts requiring resolution

## 🔧 Configuration

### Environment Variables

#### Backend
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: Database name
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Access token expiration
- `REFRESH_TOKEN_EXPIRE_DAYS`: Refresh token expiration
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4o-mini)

#### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)

## 🧪 Development

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
npm test
```

### Code Style

- **Backend**: Follow PEP 8, use type hints
- **Frontend**: Use TypeScript, follow React best practices
- **Formatting**: Use Black for Python, Prettier for TypeScript

### Git Workflow

1. Create feature branch from `main`
2. Make changes and commit
3. Push and create pull request
4. Code review and merge

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

### In Progress (~30%)
- 🚧 Agent workflow integration
- 🚧 Dynamic plan generation
- 🚧 Memory auto-updates
- 🚧 Real-time collaboration

### Planned (~10%)
- 📋 External API integrations
- 📋 Advanced plan features
- 📋 Enhanced conflict resolution UI
- 📋 WebSocket/SSE for real-time updates

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Agent workflows powered by [LangGraph](https://github.com/langchain-ai/langgraph)

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This project is in active development. Some features may be incomplete or subject to change.
