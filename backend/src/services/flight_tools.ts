import { amadeusClient, formatFlightResults } from './amadeus.js';

/**
 * Flight search tool for agent workflow
 * Extracts flight information from chat messages and searches Amadeus API
 */
export async function searchFlightsTool(
  parameters: Record<string, any>,
  _context: Record<string, any>
): Promise<any> {
  try {
    console.log('[FLIGHT_TOOL] Starting flight search with parameters:', parameters);

    // Extract and validate parameters
    const origin = parameters.origin;
    const destination = parameters.destination;
    const departureDate = parameters.departure_date || parameters.departureDate;
    const returnDate = parameters.return_date || parameters.returnDate;
    const passengers = parameters.passengers || parameters.group_size || 1;

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return {
        status: 'error',
        message: 'Missing required parameters: origin, destination, and departure_date are required',
        missing: {
          origin: !origin,
          destination: !destination,
          departure_date: !departureDate,
        },
      };
    }

    // Normalize airport codes (handle city names by extracting IATA codes)
    // Try API lookup first, then fall back to hardcoded mappings
    const originCode = await resolveAirportCode(origin);
    const destCode = await resolveAirportCode(destination);

    if (!originCode || !destCode) {
      const missing = [];
      if (!originCode) missing.push(`Origin: ${origin}`);
      if (!destCode) missing.push(`Destination: ${destination}`);
      
      return {
        status: 'error',
        message: `Could not determine airport codes for: ${missing.join(', ')}. Please provide IATA codes (e.g., JFK, LAX) or recognizable city/airport names.`,
        suggestions: {
          origin: originCode ? null : `Try using airport code or full city name for: ${origin}`,
          destination: destCode ? null : `Try using airport code or full city name for: ${destination}`,
        },
      };
    }

    console.log(`[FLIGHT_TOOL] Searching flights: ${originCode} -> ${destCode} on ${departureDate}`);

    // Call Amadeus API
    const flightData = await amadeusClient.searchFlights({
      origin: originCode,
      destination: destCode,
      departureDate: formatDate(departureDate),
      returnDate: returnDate ? formatDate(returnDate) : undefined,
      passengers: parseInt(passengers.toString(), 10),
      currency: 'USD',
    });

    // Format results
    const formatted = formatFlightResults(flightData);

    return {
      status: formatted.status,
      data: formatted.flights,
      total_price: formatted.total_price,
      currency: formatted.currency,
      count: formatted.flights.length,
      message: formatted.message || `Found ${formatted.flights.length} flight options`,
      metadata: {
        provider: 'Amadeus',
        timestamp: new Date().toISOString(),
        search_params: {
          origin: originCode,
          destination: destCode,
          departure_date: departureDate,
          return_date: returnDate,
          passengers,
        },
      },
    };
  } catch (error: any) {
    console.error('[FLIGHT_TOOL] Error:', error);
    return {
      status: 'error',
      message: `Flight search failed: ${error.message}`,
      error: error.toString(),
    };
  }
}

/**
 * Resolve airport IATA code from city name, airport name, or code
 * Uses Amadeus API first, then falls back to hardcoded mappings
 */
export async function resolveAirportCode(location: string): Promise<string | null> {
  if (!location) return null;

  const trimmed = location.trim();
  
  // If it's already a 3-letter IATA code, return it
  if (/^[A-Z]{3}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Try Amadeus API lookup first (supports any city/airport name)
  try {
    console.log(`[FLIGHT_TOOL] Looking up airport code for: ${location}`);
    const suggestions = await amadeusClient.getAirportSuggestions(trimmed);
    
    if (suggestions && suggestions.length > 0) {
      // Prefer airports over cities, prefer exact matches
      const airport = suggestions.find((loc: any) => 
        loc.subType === 'AIRPORT' && loc.iataCode
      ) || suggestions.find((loc: any) => loc.iataCode);
      
      if (airport) {
        const code = airport.iataCode || airport.address?.cityCode;
        if (code) {
          console.log(`[FLIGHT_TOOL] Found airport code via API: ${location} -> ${code}`);
          return code.toUpperCase();
        }
      }
      
      // If no airport found, try city code
      const city = suggestions.find((loc: any) => 
        loc.subType === 'CITY' && loc.address?.cityCode
      );
      if (city?.address?.cityCode) {
        const code = city.address.cityCode;
        console.log(`[FLIGHT_TOOL] Found city code via API: ${location} -> ${code}`);
        return code.toUpperCase();
      }
    }
  } catch (error: any) {
    console.warn(`[FLIGHT_TOOL] API lookup failed for "${location}":`, error.message);
    // Continue to fallback
  }

  // Fallback to hardcoded mappings for common cities (fast, no API call)
  const cityToCode: Record<string, string> = {
    'new york': 'JFK',
    'nyc': 'JFK',
    'new york city': 'JFK',
    'los angeles': 'LAX',
    'la': 'LAX',
    'san francisco': 'SFO',
    'sf': 'SFO',
    'chicago': 'ORD',
    'miami': 'MIA',
    'london': 'LHR',
    'paris': 'CDG',
    'tokyo': 'NRT',
    'sydney': 'SYD',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'bangkok': 'BKK',
    'amsterdam': 'AMS',
    'frankfurt': 'FRA',
    'madrid': 'MAD',
    'rome': 'FCO',
    'barcelona': 'BCN',
    'istanbul': 'IST',
    'moscow': 'SVO',
    'beijing': 'PEK',
    'shanghai': 'PVG',
    'seoul': 'ICN',
    'mumbai': 'BOM',
    'delhi': 'DEL',
    'cairo': 'CAI',
    'johannesburg': 'JNB',
    'sao paulo': 'GRU',
    'mexico city': 'MEX',
    'buenos aires': 'EZE',
    'toronto': 'YYZ',
    'vancouver': 'YVR',
  };

  const locationLower = trimmed.toLowerCase();
  const hardcodedCode = cityToCode[locationLower];
  if (hardcodedCode) {
    console.log(`[FLIGHT_TOOL] Found airport code via hardcoded mapping: ${location} -> ${hardcodedCode}`);
    return hardcodedCode;
  }

  console.warn(`[FLIGHT_TOOL] Could not resolve airport code for: ${location}`);
  return null;
}

/**
 * Format date to YYYY-MM-DD format
 */
export function formatDate(date: string): string {
  if (!date) return '';
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Try to parse and format
  try {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parse errors
  }

  return date;
}
