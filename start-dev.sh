#!/bin/bash

# NomadSync Development Startup Script
# Starts both backend (Express/Node.js) and frontend (Vite) servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if MongoDB is running
check_mongodb() {
    if command -v mongosh >/dev/null 2>&1 || command -v mongo >/dev/null 2>&1; then
        # Try to connect to MongoDB
        if mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1 || \
           mongo --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            return 0  # MongoDB is running
        fi
    fi
    
    # Check if MongoDB Docker container is running
    if command -v docker >/dev/null 2>&1; then
        if docker ps --format '{{.Names}}' | grep -q "^nomadsync-mongodb$"; then
            return 0  # MongoDB container is running
        fi
    fi
    
    return 1  # MongoDB is not running
}

# Function to start MongoDB
start_mongodb() {
    if command -v docker >/dev/null 2>&1 && [ -f "docker-compose.yml" ]; then
        print_info "Starting MongoDB using Docker Compose..."
        docker-compose up -d mongodb
        sleep 3
        if docker ps --format '{{.Names}}' | grep -q "^nomadsync-mongodb$"; then
            print_success "MongoDB started in Docker container"
            return 0
        else
            print_error "Failed to start MongoDB container"
            return 1
        fi
    elif command -v mongod >/dev/null 2>&1; then
        print_warning "MongoDB is not running. Please start it manually:"
        print_info "  Option 1: docker-compose up -d mongodb"
        print_info "  Option 2: mongod (if installed locally)"
        return 1
    else
        print_warning "MongoDB is not running and Docker is not available."
        print_info "Please install Docker and run: docker-compose up -d mongodb"
        return 1
    fi
}

# Function to cleanup on exit
cleanup() {
    print_info "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_info "Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_info "Frontend server stopped"
    fi
    # Note: We don't stop MongoDB by default to preserve data
    # Uncomment the next lines if you want to stop MongoDB on exit
    # if [ "$STOP_MONGODB" = "true" ]; then
    #     print_info "Stopping MongoDB..."
    #     docker-compose stop mongodb 2>/dev/null || true
    # fi
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_success "Starting NomadSync development servers..."
echo ""

# Check and start MongoDB if needed
if ! check_mongodb; then
    print_warning "MongoDB is not running"
    if ! start_mongodb; then
        print_error "Failed to start MongoDB. The backend may not work correctly."
        print_info "You can start MongoDB manually with: docker-compose up -d mongodb"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    print_success "MongoDB is already running"
fi
echo ""

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env file not found. Creating from template..."
    cat > backend/.env << EOF
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=nomadsync
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
PORT=8000
EOF
    print_success "Created backend/.env file with default values"
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    print_warning "Frontend node_modules not found. Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if backend node_modules exists
if [ ! -d "backend/node_modules" ]; then
    print_warning "Backend dependencies not found. Installing..."
    cd backend
    npm install
    cd ..
fi

# Start backend server
print_info "Starting backend server (Express/Node.js) on http://localhost:8000"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend server started (PID: $BACKEND_PID)"
else
    print_error "Backend server failed to start. Check backend.log for details."
    exit 1
fi

# Start frontend server
print_info "Starting frontend server (Vite) on http://localhost:5173"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 2

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend server started (PID: $FRONTEND_PID)"
else
    print_error "Frontend server failed to start. Check frontend.log for details."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
print_success "Development servers are running!"
echo ""
echo -e "${GREEN}MongoDB:${NC}       mongodb://localhost:27017"
echo -e "${GREEN}Backend API:${NC}  http://localhost:8000"
echo -e "${GREEN}Frontend App:${NC} http://localhost:5173"
echo -e "${GREEN}API Health:${NC}    http://localhost:8000/health"
echo ""
print_info "Press Ctrl+C to stop all servers"
print_info "Note: MongoDB will continue running (use 'docker-compose stop mongodb' to stop it)"
echo ""
print_info "Showing console logs (startup completed):"
echo "─────────────────────────────────────────────────────────"

# Tail both log files with labels using sed to prefix lines
tail -f backend.log 2>/dev/null | sed "s/^/${BLUE}[BACKEND]${NC} /" &
BACKEND_TAIL_PID=$!
tail -f frontend.log 2>/dev/null | sed "s/^/${YELLOW}[FRONTEND]${NC} /" &
FRONTEND_TAIL_PID=$!

# Enhanced cleanup function to kill tail processes
cleanup_with_tail() {
    kill $BACKEND_TAIL_PID $FRONTEND_TAIL_PID 2>/dev/null || true
    # Kill any remaining tail processes
    pkill -f "tail -f.*\.log" 2>/dev/null || true
    cleanup
}

# Update trap to include tail cleanup
trap cleanup_with_tail SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
