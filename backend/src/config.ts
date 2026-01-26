import dotenv from 'dotenv';

dotenv.config();

function parseCorsOrigins(value: string | string[] | undefined): string[] {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  
  if (!value || value === '') {
    return defaultOrigins;
  }
  
  if (Array.isArray(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return defaultOrigins;
    }
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, continue
    }
    
    // Handle comma-separated string
    if (trimmed.includes(',')) {
      const origins = trimmed.split(',').map(o => o.trim()).filter(o => o);
      return origins.length > 0 ? origins : defaultOrigins;
    }
    
    // Single string
    return [trimmed];
  }
  
  return defaultOrigins;
}

export const config = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongodbDb: process.env.MONGODB_DB || 'nomadsync',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtAlgorithm: 'HS256' as const,
  accessTokenExpireMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '15', 10),
  refreshTokenExpireDays: parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '30', 10),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  port: parseInt(process.env.PORT || '8000', 10),
  // Amadeus API Configuration
  amadeusApiKey: process.env.AMADEUS_API_KEY || '',
  amadeusApiSecret: process.env.AMADEUS_API_SECRET || '',
  amadeusBaseUrl: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com',
  // LangSmith Configuration
  langsmithTracing: process.env.LANGSMITH_TRACING === 'true',
  langsmithEndpoint: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
  langsmithApiKey: process.env.LANGSMITH_API_KEY || '',
  langsmithProject: process.env.LANGSMITH_PROJECT || 'nomadsync',
};
