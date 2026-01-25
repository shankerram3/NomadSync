import { config } from '../config.js';

interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  currency?: string;
}

interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft?: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  numberOfBookableSeats: number;
  validatingAirlineCodes: string[];
}

interface FlightSearchResponse {
  data: FlightOffer[];
  meta: {
    count: number;
  };
}

class AmadeusClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl = config.amadeusBaseUrl || 'https://test.api.amadeus.com';
    this.apiKey = config.amadeusApiKey || '';
    this.apiSecret = config.amadeusApiSecret || '';
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.accessToken;
    }

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Amadeus API credentials not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amadeus token request failed: ${response.status} ${errorText}`);
      }

      const data: AmadeusTokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error: any) {
      console.error('[AMADEUS] Token request error:', error);
      throw new Error(`Failed to get Amadeus access token: ${error.message}`);
    }
  }

  /**
   * Search for flight offers
   */
  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
    const token = await this.getAccessToken();
    const passengers = params.passengers || 1;
    const currency = params.currency || 'USD';

    // Build query parameters
    const queryParams = new URLSearchParams({
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.departureDate,
      adults: passengers.toString(),
      currencyCode: currency,
      max: '10', // Limit to 10 results
    });

    if (params.returnDate) {
      queryParams.append('returnDate', params.returnDate);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v2/shopping/flight-offers?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AMADEUS] Flight search error:', response.status, errorText);
        throw new Error(`Flight search failed: ${response.status} ${errorText}`);
      }

      const data: FlightSearchResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error('[AMADEUS] Flight search request error:', error);
      throw new Error(`Failed to search flights: ${error.message}`);
    }
  }

  /**
   * Get airport/city suggestions (for autocomplete)
   * Returns locations matching the keyword with IATA codes
   */
  async getAirportSuggestions(keyword: string): Promise<Array<{
    type: string;
    subType: string;
    name: string;
    iataCode?: string;
    address?: {
      cityCode?: string;
      cityName?: string;
      countryCode?: string;
    };
  }>> {
    const token = await this.getAccessToken();

    try {
      // Search for both airports and cities
      const response = await fetch(
        `${this.baseUrl}/v1/reference-data/locations?keyword=${encodeURIComponent(keyword)}&subType=AIRPORT,CITY`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AMADEUS] Airport search error:', response.status, errorText);
        throw new Error(`Airport search failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const locations = data.data || [];
      
      // Log for debugging
      console.log(`[AMADEUS] Found ${locations.length} locations for keyword: ${keyword}`);
      
      return locations.map((loc: any) => ({
        type: loc.type,
        subType: loc.subType,
        name: loc.name,
        iataCode: loc.iataCode,
        address: loc.address ? {
          cityCode: loc.address.cityCode,
          cityName: loc.address.cityName,
          countryCode: loc.address.countryCode,
        } : undefined,
      }));
    } catch (error: any) {
      console.error('[AMADEUS] Airport search request error:', error);
      throw new Error(`Failed to search airports: ${error.message}`);
    }
  }
}

export const amadeusClient = new AmadeusClient();

/**
 * Format flight search results for agent response
 */
export function formatFlightResults(flightData: FlightSearchResponse): {
  status: string;
  flights: any[];
  total_price?: number;
  currency?: string;
  message?: string;
} {
  if (!flightData.data || flightData.data.length === 0) {
    return {
      status: 'no_results',
      flights: [],
      message: 'No flights found for the given criteria',
    };
  }

  const formattedFlights = flightData.data.map((offer: FlightOffer) => {
    const outbound = offer.itineraries[0];
    const returnFlight = offer.itineraries[1];

    return {
      id: offer.id,
      price: {
        total: parseFloat(offer.price.total),
        currency: offer.price.currency,
      },
      outbound: {
        duration: outbound.duration,
        segments: outbound.segments.map((seg) => ({
          departure: {
            airport: seg.departure.iataCode,
            time: seg.departure.at,
          },
          arrival: {
            airport: seg.arrival.iataCode,
            time: seg.arrival.at,
          },
          airline: seg.carrierCode,
          flightNumber: seg.number,
          duration: seg.duration,
        })),
      },
      return: returnFlight
        ? {
            duration: returnFlight.duration,
            segments: returnFlight.segments.map((seg) => ({
              departure: {
                airport: seg.departure.iataCode,
                time: seg.departure.at,
              },
              arrival: {
                airport: seg.arrival.iataCode,
                time: seg.arrival.at,
              },
              airline: seg.carrierCode,
              flightNumber: seg.number,
              duration: seg.duration,
            })),
          }
        : null,
      availableSeats: offer.numberOfBookableSeats,
      airlines: offer.validatingAirlineCodes,
    };
  });

  // Find cheapest option
  const cheapest = formattedFlights.reduce((min, flight) =>
    flight.price.total < min.price.total ? flight : min
  );

  return {
    status: 'success',
    flights: formattedFlights,
    total_price: cheapest.price.total,
    currency: cheapest.price.currency,
  };
}
