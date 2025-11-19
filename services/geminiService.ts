import { GoogleGenAI } from "@google/genai";
import { GroundingChunk, ChatMessage, MessageSender } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

// Get API key - check both API_KEY and GEMINI_API_KEY for compatibility
const getApiKey = () => process.env.GEMINI_API_KEY || process.env.API_KEY;

// Initialize AI client lazily to avoid errors on app load
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required. Please set it in .env.local file.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

// Retry helper with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callGeminiAPI = async (
  message: string,
  history: ChatMessage[],
  userLocation?: { latitude: number; longitude: number },
  retryCount = 0
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  try {
    // Construct simple history for context (limit to last 10 messages to save context window if needed)
    // In a real app, we'd map strictly to the Content format, but here we'll just rely on the fresh prompt + context
    // effectively by managing a session or just sending a consolidated prompt. 
    // For this stateless implementation, we'll create a new chat model each time or just use generateContent.
    // Using generateContent is sufficient for single-turn grounded queries, but Chat is better for flow.
    // Let's use generateContent to ensure we can easily inject the tool config every time.

    const model = 'gemini-2.5-flash';
    
    // Retrieval config for location awareness
    let retrievalConfig = undefined;
    if (userLocation) {
      retrievalConfig = {
        latLng: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }
      };
    }

    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: `Context: Previous messages: ${history.map(h => `${h.sender}: ${h.text}`).join('\n')}\n\nCurrent Request: ${message}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleMaps: {} }],
        toolConfig: retrievalConfig ? {
          retrievalConfig: retrievalConfig
        } : undefined,
      },
    });

    const text = response.text || "I couldn't find that information.";
    
    // Extract grounding chunks safely
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

    return { text, groundingChunks };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for error code in the error object
    const errorCode = error?.error?.code || error?.status || error?.code;
    const errorMessage = error?.error?.message || error?.message || '';
    
    // Retry logic for 503 errors (service overloaded)
    if ((errorCode === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
      console.log(`Service overloaded, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      await sleep(delay);
      return callGeminiAPI(message, history, userLocation, retryCount + 1);
    }
    
    // Provide more specific error messages
    if (error?.message?.includes('API_KEY') || error?.message?.includes('API key') || errorCode === 401 || errorCode === 403) {
      return { 
        text: "⚠️ **API Configuration Error**\n\nPlease ensure your `GEMINI_API_KEY` is set in `.env.local`. The app needs this to connect to Google's AI services.", 
        groundingChunks: [] 
      };
    }
    
    // Service overloaded (503) - after retries exhausted
    if (errorCode === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
      return { 
        text: "⏳ **Service Temporarily Unavailable**\n\nThe AI service is currently overloaded. I've tried multiple times but it's still unavailable. Please wait a moment and try again.", 
        groundingChunks: [] 
      };
    }
    
    // Rate limiting
    if (errorCode === 429 || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return { 
        text: "⚠️ **Rate Limit Reached**\n\nI've hit the API rate limit. Please try again in a moment.", 
        groundingChunks: [] 
      };
    }
    
    // Network errors
    if (errorCode === 404 || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      return { 
        text: "🌐 **Connection Error**\n\nUnable to connect to the AI service. Please check your internet connection and try again.", 
        groundingChunks: [] 
      };
    }
    
    // Generic error fallback
    return { 
      text: `⚠️ **Error**\n\n${errorMessage || "Sorry, I encountered an error while connecting to the travel database. Please try again."}`, 
      groundingChunks: [] 
    };
  }
};

export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[],
  userLocation?: { latitude: number; longitude: number }
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  return callGeminiAPI(message, history, userLocation, 0);
};