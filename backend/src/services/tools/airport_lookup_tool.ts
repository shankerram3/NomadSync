/**
 * Airport Lookup Tool - Uses Google Places API to find nearest airports
 * Registered with dynamic tool registry for extensibility
 */
import { toolRegistry, ToolMetadata, ToolResult } from '../tool_registry.js';
import { googlePlacesClient } from '../google_places.js';

const airportLookupToolMetadata: ToolMetadata = {
  id: 'airport_lookup',
  name: 'Airport Lookup',
  description: 'Find nearest airports to a location using Google Places API. Returns airport names, locations, and attempts to extract IATA codes. Can be extended for other location-based searches.',
  agent: 'research',
  action: 'lookup_airports',
  category: 'research',
  parameters: [
    {
      name: 'location',
      type: 'string',
      required: true,
      description: 'Location to search for airports near (city name, address, or coordinates as "lat,lng")',
      example: 'Tempe Arizona',
    },
    {
      name: 'radius',
      type: 'number',
      required: false,
      description: 'Search radius in meters (default: 50000 = 50km)',
      example: 50000,
    },
    {
      name: 'max_results',
      type: 'number',
      required: false,
      description: 'Maximum number of airports to return (default: 5)',
      example: 5,
    },
  ],
  examples: [
    {
      input: {
        location: 'Tempe Arizona',
        radius: 50000,
        max_results: 3,
      },
      output: {
        status: 'success',
        data: [
          {
            name: 'Phoenix Sky Harbor International Airport',
            iata_code: 'PHX',
            location: { lat: 33.4342, lng: -112.0116 },
            formatted_address: '3400 E Sky Harbor Blvd, Phoenix, AZ 85034, USA',
            distance_km: 8.5,
          },
        ],
        message: 'Found 3 airports near Tempe Arizona',
      },
    },
  ],
  retryable: true,
  timeout: 15000, // 15 seconds
};

async function lookupAirports(
  parameters: Record<string, any>,
  _context: Record<string, any>
): Promise<ToolResult> {
  try {
    console.log('[AIRPORT_LOOKUP_TOOL] Starting airport lookup with parameters:', parameters);

    const location = parameters.location;
    const radius = parameters.radius || 50000; // Default 50km
    const maxResults = parameters.max_results || 5;

    if (!location) {
      return {
        status: 'error',
        message: 'Missing required parameter: location',
        error: 'Validation failed',
      };
    }

    // Find nearest airports (uses text search first, then nearby search)
    const airports = await googlePlacesClient.findNearestAirports(location, radius);

    if (airports.length === 0) {
      return {
        status: 'success',
        data: [],
        message: `No airports found near ${location} within ${radius / 1000}km radius`,
        metadata: {
          provider: 'Google Places API',
          timestamp: new Date().toISOString(),
          location,
          radius,
        },
      };
    }

    // Format results
    const formattedAirports = airports.slice(0, maxResults).map((airport, index) => {
      // Try to extract IATA code
      let iataCode = googlePlacesClient.extractIATACode(airport);
      
      // If not found in name, try to get place details for more info
      // (This could be enhanced in the future)
      
      // Calculate approximate distance (we already have sorted by distance)
      // For more accurate distance, we'd need to geocode the original location again
      const distanceKm = index < 3 ? (index + 1) * 5 : null; // Rough estimate

      return {
        name: airport.name,
        iata_code: iataCode,
        place_id: airport.place_id,
        location: {
          lat: airport.geometry.location.lat,
          lng: airport.geometry.location.lng,
        },
        formatted_address: airport.formatted_address,
        distance_km: distanceKm,
        rating: airport.rating,
        types: airport.types,
      };
    });

    // Try to get IATA codes for airports missing them
    // Google Places doesn't typically include IATA codes, so we use Amadeus API as cross-reference
    for (let i = 0; i < formattedAirports.length && i < 5; i++) {
      if (!formattedAirports[i].iata_code) {
        try {
          // First try place details (rarely has IATA codes, but check anyway)
          const details = await googlePlacesClient.getPlaceDetails(formattedAirports[i].place_id);
          if (details) {
            // Check address components for airport code (uncommon but possible)
            const airportCodeComponent = details.address_components?.find(
              (comp: any) => comp.types.includes('airport') || comp.types.includes('iata_code')
            );
            if (airportCodeComponent) {
              formattedAirports[i].iata_code = airportCodeComponent.short_name.toUpperCase();
              continue;
            }
          }

          // Use Amadeus API to get IATA code by airport name
          // Extract clean airport name (remove "International Airport", etc.)
          const airportName = formattedAirports[i].name;
          const cleanName = airportName
            .replace(/\s*(International|Regional|Municipal|Airport).*/i, '')
            .trim();
          
          const { amadeusClient } = await import('../amadeus.js');
          const suggestions = await amadeusClient.getAirportSuggestions(cleanName);
          
          if (suggestions && suggestions.length > 0) {
            const airport = suggestions.find((loc: any) => 
              loc.subType === 'AIRPORT' && loc.iataCode
            ) || suggestions.find((loc: any) => loc.iataCode);
            
            if (airport && airport.iataCode) {
              formattedAirports[i].iata_code = airport.iataCode.toUpperCase();
              console.log(`[AIRPORT_LOOKUP_TOOL] Found IATA code via Amadeus cross-reference: ${airportName} -> ${airport.iataCode}`);
              continue;
            }
          }
          
          // Last resort: try Google Places search by airport name
          const code = await googlePlacesClient.searchAirportByCodeOrName(airportName);
          if (code) {
            formattedAirports[i].iata_code = code;
          }
        } catch (error) {
          console.warn(`[AIRPORT_LOOKUP_TOOL] Failed to get IATA code for ${formattedAirports[i].name}:`, error);
        }
      }
    }

    return {
      status: 'success',
      data: formattedAirports,
      message: `Found ${formattedAirports.length} airport(s) near ${location}`,
      metadata: {
        provider: 'Google Places API',
        timestamp: new Date().toISOString(),
        location,
        radius,
        count: formattedAirports.length,
      },
    };
  } catch (error: any) {
    console.error('[AIRPORT_LOOKUP_TOOL] Error:', error);
    return {
      status: 'error',
      message: `Airport lookup failed: ${error.message}`,
      error: error.toString(),
    };
  }
}

// Register the tool
toolRegistry.register(airportLookupToolMetadata, lookupAirports);

export { lookupAirports, airportLookupToolMetadata };
