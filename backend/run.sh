#!/bin/bash
# Start the FastAPI server

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=nomadsync
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
EOF
    echo "✅ Created .env file with default values"
fi

# Start uvicorn
echo "🚀 Starting NomadSync API server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
