import { config } from '../config.js';

interface GooglePlacesLocation {
  lat: number;
  lng: number;
}

interface GooglePlacesResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: GooglePlacesLocation;
  };
  types: string[];
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlacesResponse {
  results: GooglePlacesResult[];
  status: string;
  error_message?: string;
}

interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: GooglePlacesLocation;
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  types: string[];
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface PlaceDetailsResponse {
  result: PlaceDetailsResult;
  status: string;
  error_message?: string;
}

class GooglePlacesClient {
  private apiKey: string;
  private baseUrl: string = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.apiKey = config.googlePlacesApiKey || '';
    if (!this.apiKey) {
      console.warn('[GOOGLE_PLACES] Google Places API key not configured');
    }
  }

  /**
   * Search for places (airports, cities, etc.) by text query
   * Uses Google Places Text Search API which is more reliable for city names
   */
  async searchPlaces(query: string, types?: string[]): Promise<GooglePlacesResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const params = new URLSearchParams({
        query: query,
        key: this.apiKey,
      });

      // Note: Text Search API doesn't support type filtering in the same way as Nearby Search
      // The type parameter is ignored in Text Search, but we can filter results after
      // For airports, we'll filter by types after getting results

      const response = await fetch(
        `${this.baseUrl}/place/textsearch/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Places API request failed: ${response.status}`);
      }

      const data = (await response.json()) as GooglePlacesResponse;

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        let results = data.results || [];
        
        // Filter by types if specified (since Text Search doesn't support type parameter)
        if (types && types.length > 0 && results.length > 0) {
          results = results.filter((result: GooglePlacesResult) => 
            result.types && types.some(type => result.types.includes(type))
          );
        }
        
        return results;
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error(`Google Places API access denied: ${data.error_message || 'Invalid API key or billing not enabled'}`);
      } else {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('[GOOGLE_PLACES] Search error:', error);
      throw error;
    }
  }

  /**
   * Find nearest airports to a location (city name, coordinates, or address)
   * Uses text search first (more reliable for city names), then nearby search as fallback
   */
  async findNearestAirports(location: string, radius: number = 50000): Promise<GooglePlacesResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      // First try text search - more reliable for city names like "Tempe Arizona"
      // This finds airports by searching for "{location} airport"
      const textSearchQuery = `${location} airport`;
      const textResults = await this.searchPlaces(textSearchQuery, ['airport']);
      
      if (textResults && textResults.length > 0) {
        // Filter to only airports (not hotels or other places with "airport" in name)
        const airports = textResults.filter((result: GooglePlacesResult) => 
          result.types && result.types.includes('airport')
        );
        
        if (airports.length > 0) {
          console.log(`[GOOGLE_PLACES] Found ${airports.length} airport(s) via text search for: ${location}`);
          return airports;
        }
      }

      // Fallback to nearby search using coordinates
      // First, geocode the location to get coordinates
      const geocodeResult = await this.geocodeLocation(location);
      if (!geocodeResult || !geocodeResult.geometry) {
        throw new Error(`Could not geocode location: ${location}`);
      }

      const { lat, lng } = geocodeResult.geometry.location;

      // Search for airports near the location
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: radius.toString(),
        type: 'airport',
        key: this.apiKey,
      });

      const response = await fetch(
        `${this.baseUrl}/place/nearbysearch/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Places API request failed: ${response.status}`);
      }

      const data = (await response.json()) as GooglePlacesResponse;

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        // Sort by distance (closest first) - Google returns them roughly sorted but we can refine
        const airports = (data.results || []).sort((a, b) => {
          // Calculate distance (simple approximation)
          const distA = this.calculateDistance(lat, lng, a.geometry.location.lat, a.geometry.location.lng);
          const distB = this.calculateDistance(lat, lng, b.geometry.location.lat, b.geometry.location.lng);
          return distA - distB;
        });
        console.log(`[GOOGLE_PLACES] Found ${airports.length} airport(s) via nearby search for: ${location}`);
        return airports;
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error(`Google Places API access denied: ${data.error_message || 'Invalid API key or billing not enabled'}`);
      } else {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('[GOOGLE_PLACES] Find airports error:', error);
      throw error;
    }
  }

  /**
   * Geocode a location (address, city name, etc.) to get coordinates
   */
  async geocodeLocation(location: string): Promise<{ geometry: { location: GooglePlacesLocation } } | null> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const params = new URLSearchParams({
        address: location,
        key: this.apiKey,
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Geocoding API request failed: ${response.status}`);
      }

      const data = (await response.json()) as { status: string; results?: any[] };

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Return the first (most relevant) result with geometry
        const result = data.results[0];
        return {
          geometry: {
            location: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            },
          },
        };
      }

      return null;
    } catch (error: any) {
      console.error('[GOOGLE_PLACES] Geocode error:', error);
      throw error;
    }
  }

  /**
   * Get place details by place_id
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'place_id,name,formatted_address,geometry,address_components,types,international_phone_number,website,rating,user_ratings_total',
        key: this.apiKey,
      });

      const response = await fetch(
        `${this.baseUrl}/place/details/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Places API request failed: ${response.status}`);
      }

      const data = (await response.json()) as PlaceDetailsResponse;

      if (data.status === 'OK') {
        return data.result;
      }

      return null;
    } catch (error: any) {
      console.error('[GOOGLE_PLACES] Get place details error:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Extract IATA code from airport name or address
   * This is a heuristic - Google Places doesn't always include IATA codes
   * Improved patterns to catch more cases
   */
  extractIATACode(airport: GooglePlacesResult): string | null {
    const invalidCodes = ['SKY', 'AIR', 'INT', 'TER', 'POR', 'HAR', 'BOR', 'REG', 'MUN', 'CIP', 'NAL', 'TIO', 'TAL', 'TIN', 'TAR', 'TEN', 'TEL', 'TIC', 'TID', 'TIE', 'TIF', 'TIG', 'TIL', 'TIM', 'TIN', 'TIO', 'TIP', 'TIR', 'TIS', 'TIT', 'TIU', 'TIV', 'TIW', 'TIX', 'TIY', 'TIZ'];
    
    // Pattern 1: Parentheses at end (most common): "Airport Name (CODE)"
    const parenEndMatch = airport.name.match(/\(([A-Z]{3})\)\s*$/);
    if (parenEndMatch) {
      const code = parenEndMatch[1];
      if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code)) {
        return code;
      }
    }

    // Pattern 2: Parentheses anywhere: "Airport (CODE) Name" or "Name (CODE)"
    const parenAnyMatch = airport.name.match(/\(([A-Z]{3})\)/);
    if (parenAnyMatch) {
      const code = parenAnyMatch[1];
      if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code)) {
        return code;
      }
    }

    // Pattern 3: "Airport - CODE" or "Airport CODE" (with dash or space)
    const airportCodeMatch = airport.name.match(/Airport[-\s]+([A-Z]{3})\b/i);
    if (airportCodeMatch) {
      const code = airportCodeMatch[1];
      if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code)) {
        return code;
      }
    }

    // Pattern 4: "CODE Airport" (code before airport)
    const codeAirportMatch = airport.name.match(/\b([A-Z]{3})\s+Airport\b/i);
    if (codeAirportMatch) {
      const code = codeAirportMatch[1];
      if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code)) {
        return code;
      }
    }

    // Pattern 5: "CODE - Airport Name" or "CODE: Airport Name"
    const codeDashMatch = airport.name.match(/^([A-Z]{3})[-\s:]+/);
    if (codeDashMatch) {
      const code = codeDashMatch[1];
      if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code)) {
        return code;
      }
    }

    // Pattern 6: Standalone 3-letter code at start or end (with word boundaries)
    const standaloneMatch = airport.name.match(/(?:^|\s)([A-Z]{3})(?:\s|$)/);
    if (standaloneMatch) {
      const code = standaloneMatch[1];
      if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code)) {
        return code;
      }
    }

    // Pattern 7: Check formatted address for IATA codes
    if (airport.formatted_address) {
      const addressParenMatch = airport.formatted_address.match(/\(([A-Z]{3})\)/);
      if (addressParenMatch) {
        const code = addressParenMatch[1];
        if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code)) {
          return code;
        }
      }
      
      // Also check for standalone codes in address
      const addressCodeMatch = airport.formatted_address.match(/\b([A-Z]{3})\b/);
      if (addressCodeMatch) {
        const code = addressCodeMatch[1];
        // More strict validation for address codes
        if (!invalidCodes.includes(code) && /^[A-Z]{3}$/.test(code) && 
            !airport.formatted_address.toLowerCase().includes(code.toLowerCase() + ' airport')) {
          // Additional check: make sure it's not part of a word
          const context = airport.formatted_address.substring(
            Math.max(0, addressCodeMatch.index! - 2),
            Math.min(airport.formatted_address.length, addressCodeMatch.index! + 5)
          );
          if (/[^A-Z]([A-Z]{3})[^A-Z]/.test(context)) {
            return code;
          }
        }
      }
    }

    return null;
  }

  /**
   * Use Google Places Autocomplete API for better airport search results
   * Autocomplete often returns more structured data including IATA codes
   */
  async autocompleteAirport(query: string): Promise<GooglePlacesResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const params = new URLSearchParams({
        input: query,
        types: 'airport',
        key: this.apiKey,
      });

      const response = await fetch(
        `${this.baseUrl}/place/autocomplete/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Places Autocomplete API request failed: ${response.status}`);
      }

      const data = (await response.json()) as { status: string; predictions?: any[] };

      if (data.status === 'OK' && data.predictions) {
        // Autocomplete returns predictions, not full results
        // We need to get place details for each prediction
        const placeIds = data.predictions
          .filter((p: any) => p.types && p.types.includes('airport'))
          .slice(0, 5) // Limit to top 5
          .map((p: any) => p.place_id);

        // Get details for each place
        const detailsPromises = placeIds.map((placeId: string) => 
          this.getPlaceDetails(placeId).catch(() => null)
        );
        
        const details = await Promise.all(detailsPromises);
        return details.filter((d: PlaceDetailsResult | null): d is PlaceDetailsResult => d !== null).map((d: PlaceDetailsResult) => ({
          place_id: d.place_id,
          name: d.name,
          formatted_address: d.formatted_address,
          geometry: d.geometry,
          types: d.types,
        }));
      }

      return [];
    } catch (error: any) {
      console.warn('[GOOGLE_PLACES] Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Search for airport by IATA code or name and return IATA code
   * Uses multiple strategies: Autocomplete, text search with variations
   */
  async searchAirportByCodeOrName(query: string): Promise<string | null> {
    try {
      // If it's already a 3-letter code, return it
      if (/^[A-Z]{3}$/i.test(query.trim())) {
        return query.trim().toUpperCase();
      }

      const trimmed = query.trim();
      
      // Strategy 1: Try Autocomplete API first (often better structured results)
      try {
        const autocompleteResults = await this.autocompleteAirport(trimmed);
        if (autocompleteResults.length > 0) {
          for (const airport of autocompleteResults) {
            const code = this.extractIATACode(airport);
            if (code) {
              console.log(`[GOOGLE_PLACES] Found IATA code via Autocomplete: ${trimmed} -> ${code}`);
              return code;
            }
          }
        }
      } catch (autocompleteError) {
        // Continue to other strategies
        console.warn('[GOOGLE_PLACES] Autocomplete failed, trying text search');
      }

      // Strategy 2: Try multiple search query variations
      const searchVariations = [
        `${trimmed} airport`,           // "Thiruvananthapuram airport"
        `${trimmed} airport IATA`,     // "Thiruvananthapuram airport IATA"
        `${trimmed} airport code`,     // "Thiruvananthapuram airport code"
        `${trimmed} international airport`, // "Thiruvananthapuram international airport"
        `airport ${trimmed}`,          // "airport Thiruvananthapuram"
      ];

      for (const searchQuery of searchVariations) {
        try {
          const results = await this.searchPlaces(searchQuery, ['airport']);
          
          if (results.length > 0) {
            const airports = results.filter((r: GooglePlacesResult) => 
              r.types && r.types.includes('airport')
            );
            
            if (airports.length > 0) {
              // Try each airport result (not just the first)
              for (const airport of airports.slice(0, 3)) { // Check top 3
                const code = this.extractIATACode(airport);
                if (code) {
                  console.log(`[GOOGLE_PLACES] Found IATA code via text search (${searchQuery}): ${trimmed} -> ${code}`);
                  return code;
                }
                
                // If extraction failed, try getting place details
                try {
                  const details = await this.getPlaceDetails(airport.place_id);
                  if (details) {
                    // Try extracting from details (name might be different)
                    const detailsCode = this.extractIATACode({
                      ...airport,
                      name: details.name,
                      formatted_address: details.formatted_address,
                    });
                    if (detailsCode) {
                      console.log(`[GOOGLE_PLACES] Found IATA code via place details: ${trimmed} -> ${detailsCode}`);
                      return detailsCode;
                    }
                    
                    // Check address components (rare but possible)
                    const airportCodeComponent = details.address_components?.find(
                      (comp: any) => comp.types.includes('airport') || comp.types.includes('iata_code')
                    );
                    if (airportCodeComponent) {
                      const code = airportCodeComponent.short_name.toUpperCase();
                      if (/^[A-Z]{3}$/.test(code)) {
                        console.log(`[GOOGLE_PLACES] Found IATA code via address components: ${trimmed} -> ${code}`);
                        return code;
                      }
                    }
                  }
                } catch (detailError) {
                  // Continue to next airport
                }
              }
            }
          }
        } catch (searchError) {
          // Continue to next variation
          continue;
        }
      }

      // Strategy 3: Try searching without "airport" keyword (in case it's already in the name)
      try {
        const results = await this.searchPlaces(trimmed, ['airport']);
        if (results.length > 0) {
          const airports = results.filter((r: GooglePlacesResult) => 
            r.types && r.types.includes('airport')
          );
          if (airports.length > 0) {
            const code = this.extractIATACode(airports[0]);
            if (code) {
              console.log(`[GOOGLE_PLACES] Found IATA code via direct search: ${trimmed} -> ${code}`);
              return code;
            }
          }
        }
      } catch (error) {
        // Final fallback failed
      }

      return null;
    } catch (error) {
      console.warn('[GOOGLE_PLACES] Airport search failed:', error);
      return null;
    }
  }
}

export const googlePlacesClient = new GooglePlacesClient();
