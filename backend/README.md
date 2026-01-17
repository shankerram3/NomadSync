# NomadSync Backend API

FastAPI backend for the Collaborative Travel Planner application.

## Setup

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Start MongoDB:**
Make sure MongoDB is running on `localhost:27017` or update `MONGODB_URI` in `.env`.

4. **Run the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

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
- `POST /trips/{trip_id}/invite` - Invite member

### Messages
- `GET /trips/{trip_id}/messages` - Get messages
- `POST /trips/{trip_id}/messages` - Create message

### Conflicts
- `POST /trips/{trip_id}/conflicts` - Create conflict
- `POST /trips/{trip_id}/conflicts/{conflict_id}/vote` - Vote on conflict
- `GET /trips/{trip_id}/conflicts/{conflict_id}` - Get conflict

### Plan
- `GET /trips/{trip_id}/plan` - Get plan (latest or specific version)
- `POST /trips/{trip_id}/plan` - Create plan version
- `GET /trips/{trip_id}/plan/versions` - List plan versions

### Memory
- `GET /trips/{trip_id}/memory` - Get trip memory
- `PATCH /trips/{trip_id}/memory` - Update trip memory

### Agents
- `POST /agents/plan` - Run LangGraph agent workflow for trip planning

## Authentication

Most endpoints require authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Database Schema

The backend uses MongoDB with the following collections:
- `users` - User accounts
- `trips` - Trip documents
- `messages` - Chat messages
- `conflicts` - Conflict resolution options
- `plan_versions` - Trip plan versions
- `trip_memory` - AI-extracted trip memory
