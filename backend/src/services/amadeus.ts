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
   * Create a flight order (book flights)
   * Requires flight offers from search, traveler information, and payment details
   */
  async createFlightOrder(orderData: {
    flightOffers: any[];
    travelers: Array<{
      id: string;
      dateOfBirth: string;
      name: {
        firstName: string;
        lastName: string;
      };
      gender?: 'MALE' | 'FEMALE' | 'UNSPECIFIED' | 'UNDISCLOSED';
      contact?: {
        emailAddress: string;
        phones?: Array<{
          deviceType: 'MOBILE' | 'LANDLINE' | 'FAX';
          countryCallingCode: string;
          number: string;
        }>;
      };
      documents?: Array<{
        documentType: 'PASSPORT' | 'IDENTITY_CARD' | 'VISA' | 'KNOWN_TRAVELER' | 'REDRESS';
        number: string;
        expiryDate?: string;
        issuanceCountry?: string;
        nationality?: string;
        holder?: boolean;
      }>;
    }>;
    remarks?: {
      general?: Array<{
        subType: string;
        text: string;
      }>;
    };
    ticketingAgreement?: {
      option: 'CONFIRM' | 'DELAY_TO_QUEUE' | 'DELAY_TO_CANCEL';
      delay?: string;
    };
    contacts?: Array<{
      addresseeName?: {
        firstName: string;
        lastName: string;
      };
      companyName?: string;
      purpose?: 'STANDARD' | 'INVOICE' | 'STANDARD_WITHOUT_TRANSMISSION';
      phones?: Array<{
        deviceType: 'MOBILE' | 'LANDLINE' | 'FAX';
        countryCallingCode: string;
        number: string;
      }>;
      emailAddress?: string;
      address?: {
        lines: string[];
        postalCode?: string;
        cityName?: string;
        countryCode: string;
      };
    }>;
  }): Promise<any> {
    const token = await this.getAccessToken();

    const requestBody = {
      data: {
        type: 'flight-order',
        flightOffers: orderData.flightOffers,
        travelers: orderData.travelers,
        ...(orderData.remarks && { remarks: orderData.remarks }),
        ...(orderData.ticketingAgreement && { ticketingAgreement: orderData.ticketingAgreement }),
        ...(orderData.contacts && { contacts: orderData.contacts }),
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/booking/flight-orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.amadeus+json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AMADEUS] Flight booking error:', response.status, errorText);
        throw new Error(`Flight booking failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('[AMADEUS] Flight booking request error:', error);
      throw new Error(`Failed to create flight order: ${error.message}`);
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

  /**
   * Get airline name by IATA code
   * Uses Amadeus Reference Data API to fetch airline information dynamically
   * Results are cached to avoid repeated API calls
   */
  private airlineCache: Map<string, { name: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days cache

  async getAirlineName(airlineCode: string): Promise<string> {
    if (!airlineCode || airlineCode.length !== 2) {
      return airlineCode;
    }

    const code = airlineCode.toUpperCase();

    // Check cache first
    const cached = this.airlineCache.get(code);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.name;
    }

    try {
      const token = await this.getAccessToken();
      
      // Use Amadeus Reference Data API for airlines
      const response = await fetch(
        `${this.baseUrl}/v1/reference-data/airlines?airlineCodes=${code}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const airline = data.data[0];
          const airlineName = airline.businessName || airline.commonName || code;
          
          // Cache the result
          this.airlineCache.set(code, {
            name: airlineName,
            timestamp: Date.now(),
          });
          
          return airlineName;
        }
      } else {
        console.warn(`[AMADEUS] Failed to fetch airline name for ${code}: ${response.status}`);
      }
    } catch (error: any) {
      console.warn(`[AMADEUS] Error fetching airline name for ${code}:`, error.message);
    }

    // Fallback: return the code if API call fails
    return code;
  }

  /**
   * Batch fetch airline names for multiple codes
   * More efficient than individual calls
   */
  async getAirlineNames(codes: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const codesToFetch: string[] = [];

    // Check cache for each code
    for (const code of codes) {
      const upperCode = code.toUpperCase();
      const cached = this.airlineCache.get(upperCode);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        result[upperCode] = cached.name;
      } else if (upperCode.length === 2) {
        codesToFetch.push(upperCode);
      } else {
        result[upperCode] = upperCode;
      }
    }

    // Fetch uncached codes in batches (Amadeus allows multiple codes in one request)
    if (codesToFetch.length > 0) {
      try {
        const token = await this.getAccessToken();
        const uniqueCodes = [...new Set(codesToFetch)];
        const codesParam = uniqueCodes.join(',');
        
        const response = await fetch(
          `${this.baseUrl}/v1/reference-data/airlines?airlineCodes=${codesParam}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            for (const airline of data.data) {
              const code = airline.iataCode?.toUpperCase();
              if (code) {
                const airlineName = airline.businessName || airline.commonName || code;
                result[code] = airlineName;
                
                // Cache the result
                this.airlineCache.set(code, {
                  name: airlineName,
                  timestamp: Date.now(),
                });
              }
            }
          }
        }
      } catch (error: any) {
        console.warn(`[AMADEUS] Error batch fetching airline names:`, error.message);
      }
    }

    // Fill in any missing codes with the code itself
    for (const code of codes) {
      const upperCode = code.toUpperCase();
      if (!result[upperCode]) {
        result[upperCode] = upperCode;
      }
    }

    return result;
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
