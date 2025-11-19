<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NomadSync - AI Travel Planner

A collaborative travel companion for planning trips with friends. Features AI-powered itinerary generation using Google Maps data, real-time expense splitting, and trip organization.

## Run Locally

### Option 1: Using Docker (Recommended)

**Prerequisites:** Docker and Docker Compose

#### Development Mode (with hot reload):
```bash
# Create .env.local file with your API key
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# Start development container
docker-compose up app-dev
```

The app will be available at `http://localhost:3000`

#### Production Mode:
```bash
# Build and run production container
docker-compose up app
```

The app will be available at `http://localhost:8080`

### Option 2: Using Node.js

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local`:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`

## Docker Commands

### Build production image:
```bash
docker build -t nomadsync:latest .
```

### Run production container:
```bash
docker run -p 8080:80 --env-file .env.local nomadsync:latest
```

### Build development image:
```bash
docker build -f Dockerfile.dev -t nomadsync:dev .
```

### Run development container:
```bash
docker run -p 3000:3000 -v $(pwd):/app --env-file .env.local nomadsync:dev
```

## Environment Variables

- `GEMINI_API_KEY` (required): Your Google Gemini API key. Get it from [Google AI Studio](https://aistudio.google.com/apikey)
- `GOOGLE_MAPS_API_KEY` (optional): Your Google Maps API key for interactive route maps. Get it from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)

### Google Maps API Setup

For the interactive route maps to work properly, you need to:

1. **Enable the required APIs** in Google Cloud Console:
   - Maps JavaScript API
   - Directions API
   - Geocoding API (for fallback)

2. **Get your API key** from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)

3. **Add to `.env.local`**:
   ```bash
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

**Note:** Using the Directions API may incur fees. Check [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/) for details.

If no API key is provided, the app will show a visual route preview instead.

## Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.
