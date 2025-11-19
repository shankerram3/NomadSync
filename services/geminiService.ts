import { GoogleGenAI } from "@google/genai";
import { GroundingChunk, ChatMessage, MessageSender } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

// Ensure API key is present
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[],
  userLocation?: { latitude: number; longitude: number }
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  
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

    const response = await ai.models.generateContent({
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

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, I encountered an error while connecting to the travel database. Please try again.", groundingChunks: [] };
  }
};