# Frontend-Backend Integration Guide

This document describes how the React frontend is integrated with the FastAPI backend.

## Architecture

### API Client (`src/lib/api.ts`)
- Centralized HTTP client with automatic token management
- Handles authentication headers
- Manages token storage in localStorage
- Base URL configurable via `VITE_API_URL` environment variable

### Service Layer (`src/services/`)
- **auth.ts**: Authentication (login, register, refresh token)
- **trips.ts**: Trip CRUD operations
- **messages.ts**: Chat message operations
- **conflicts.ts**: Conflict resolution and voting
- **plan.ts**: Trip plan versioning
- **memory.ts**: AI-extracted trip memory

### Authentication Context (`src/contexts/AuthContext.tsx`)
- Provides authentication state throughout the app
- Manages user session
- Handles login/logout
- Protected routes check authentication status

## Environment Setup

1. **Create `.env` file in project root:**
```bash
VITE_API_URL=http://localhost:8000
```

2. **Backend must be running on port 8000** (or update the URL)

## API Integration Points

### Authentication Flow
1. User logs in via `LoginPage`
2. `authService.login()` sends credentials to `/auth/login`
3. Backend returns `access_token` and `refresh_token`
4. Tokens stored in localStorage
5. All subsequent requests include `Authorization: Bearer <token>` header

### Protected Routes
- Routes wrapped in `<ProtectedRoute>` component
- Automatically redirects to login if not authenticated
- Uses `useAuth()` hook to check authentication status

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

## Running the Application

### Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
npm install
npm run dev
```

Frontend will run on `http://localhost:5173` and connect to backend at `http://localhost:8000`

## API Endpoints Used

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login (OAuth2 form data)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user

### Trips
- `GET /trips` - List user's trips
- `POST /trips` - Create new trip
- `GET /trips/{id}` - Get trip details
- `PATCH /trips/{id}` - Update trip
- `POST /trips/{id}/invite` - Invite member

### Messages
- `GET /trips/{id}/messages` - Get messages
- `POST /trips/{id}/messages` - Create message

### Conflicts
- `POST /trips/{id}/conflicts` - Create conflict
- `POST /trips/{id}/conflicts/{id}/vote` - Vote on conflict
- `GET /trips/{id}/conflicts/{id}` - Get conflict

### Plan
- `GET /trips/{id}/plan` - Get plan (latest or version)
- `POST /trips/{id}/plan` - Create plan version

### Memory
- `GET /trips/{id}/memory` - Get trip memory
- `PATCH /trips/{id}/memory` - Update memory

## Error Handling

- API errors are caught and displayed to users
- 401 errors automatically clear tokens and redirect to login
- Network errors show user-friendly messages

## Token Management

- Access tokens stored in localStorage
- Refresh tokens used to get new access tokens
- Tokens automatically included in API requests
- Logout clears all tokens

## Next Steps

1. **Implement conflict fetching** - Currently conflicts are not fully loaded
2. **Add real-time updates** - Consider WebSocket for live message updates
3. **Agent integration** - Connect to AI agent for automatic plan generation
4. **Image uploads** - Add trip cover image upload functionality
5. **Member management** - Full user lookup and avatar display
