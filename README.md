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

## 📁 Project Structure

```
NomadSync/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Pydantic models
│   │   ├── routers/        # API route handlers
│   │   ├── utils/          # Utility functions
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # MongoDB connection
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
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

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd NomadSync
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**Note**: If you encounter Pydantic build errors, ensure you're using Python 3.11 or 3.12. See `backend/SETUP.md` for troubleshooting.

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

**Note**: Most endpoints require authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

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

### State Management
- **AuthContext** - Global authentication state
- **Service Layer** - API communication abstraction
- **API Client** - Centralized HTTP client with token management

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

1. **Pydantic build errors**: Use Python 3.11 or 3.12 (not 3.14)
2. **MongoDB connection errors**: Ensure MongoDB is running on port 27017
3. **Bcrypt version warning**: Should be resolved with `bcrypt<5.0.0` in requirements.txt

See `backend/SETUP.md` for detailed troubleshooting.

### Frontend Issues

1. **API connection errors**: Ensure backend is running on port 8000
2. **CORS errors**: Backend CORS is configured for `http://localhost:5173`
3. **Token errors**: Clear localStorage and re-login

## 📝 Environment Variables

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Access token expiry
- `REFRESH_TOKEN_EXPIRE_DAYS` - Refresh token expiry

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

## 🚧 Roadmap

- [ ] Real-time message updates (WebSocket)
- [ ] AI agent integration for automatic plan generation
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

## 📚 Additional Documentation

- [Backend README](backend/README.md) - Detailed backend documentation
- [Integration Guide](INTEGRATION.md) - Frontend-backend integration details
- [Backend Setup](backend/SETUP.md) - Backend troubleshooting guide

---

Built with ❤️ using React, FastAPI, and MongoDB
