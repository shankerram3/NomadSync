import { User } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'You', avatarColor: 'bg-blue-500' },
  { id: 'u2', name: 'Alex', avatarColor: 'bg-green-500' },
  { id: 'u3', name: 'Sam', avatarColor: 'bg-purple-500' },
  { id: 'u4', name: 'Jordan', avatarColor: 'bg-orange-500' },
];

export const SUGGESTED_PROMPTS = [
  "Find a top-rated hotel in downtown Tokyo under $200",
  "Suggest a road trip route from SF to LA with scenic stops",
  "Where can we rent a car near Heathrow Airport?",
  "What are the best Italian restaurants nearby?"
];

export const SYSTEM_INSTRUCTION = `You are NomadSync, an expert AI travel assistant. 
Your goal is to help groups plan trips, find accommodation, rent cars, and discover local gems.
You have access to Google Maps data. ALWAYS use it when the user asks about locations, hotels, restaurants, or routes.
Be concise, helpful, and enthusiastic.
Format your responses using Markdown.
If you find places using Google Maps, they will be automatically displayed to the user, so you can refer to them in your text.`;