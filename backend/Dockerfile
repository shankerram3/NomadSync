# Build frontend stage
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files (build context should be project root)
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY index.html ./
COPY src ./src

# Build argument for API URL (empty since we're serving from same origin)
ARG VITE_API_URL=/api

# Set environment variable for build
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend
RUN npm run build

# Backend stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy backend source code and config
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source files
RUN npm ci --only=production && \
    rm -rf src tsconfig.json

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose port (default to 8000, but Railway will set $PORT)
EXPOSE 8000

# Set default PORT environment variable if not provided
ENV PORT=8000
ENV NODE_ENV=production

# Run the application using $PORT from Railway
CMD ["node", "dist/server.js"]
