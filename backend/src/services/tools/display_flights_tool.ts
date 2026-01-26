/**
 * Display Flights Tool - Formats flight data for UI display
 * This tool converts flight search results into a format that can be rendered as FlightCard components
 */
import { toolRegistry, ToolMetadata, ToolResult } from '../tool_registry.js';

const displayFlightsToolMetadata: ToolMetadata = {
  id: 'display_flights',
  name: 'Display Flights',
  description: 'Format flight search results for UI display. Converts flight data into a structured format that can be rendered as flight cards in the user interface.',
  agent: 'research',
  action: 'display_flights',
  category: 'utility',
  parameters: [
    {
      name: 'flight_data',
      type: 'object',
      required: true,
      description: 'Flight search results from flight_search tool (should contain data array with flight objects)',
      example: {
        status: 'success',
        data: [
          {
            id: '1',
            price: { total: 150, currency: 'USD' },
            outbound: {
              segments: [
                {
                  departure: { airport: 'PHX', time: '2026-02-11T10:00:00' },
                  arrival: { airport: 'SFO', time: '2026-02-11T12:30:00' },
                  airline: 'WN',
                },
              ],
            },
            return: {
              segments: [
                {
                  departure: { airport: 'SFO', time: '2026-02-15T17:00:00' },
                  arrival: { airport: 'PHX', time: '2026-02-15T19:30:00' },
                  airline: 'WN',
                },
              ],
            },
          },
        ],
      },
    },
  ],
  examples: [
    {
      input: {
        flight_data: {
          status: 'success',
          data: [
            {
              id: '1',
              price: { total: 150, currency: 'USD' },
              outbound: {
                segments: [
                  {
                    departure: { airport: 'PHX', time: '2026-02-11T10:00:00' },
                    arrival: { airport: 'SFO', time: '2026-02-11T12:30:00' },
                    airline: 'WN',
                  },
                ],
              },
            },
          ],
        },
      },
      output: {
        status: 'success',
        data: [
          {
            airline: 'Southwest Airlines',
            departure: { date: 'February 11, 2026', time: '10:00 AM' },
            arrival: { date: 'February 11, 2026', time: '12:30 PM' },
            price: '$150',
            isBestValue: false,
          },
        ],
      },
    },
  ],
  retryable: false,
  timeout: 5000,
};

// Airline code to name mapping (IATA codes)
const AIRLINE_NAMES: Record<string, string> = {
  // Major US Airlines
  'WN': 'Southwest Airlines',
  'AA': 'American Airlines',
  'DL': 'Delta Air Lines',
  'UA': 'United Airlines',
  'AS': 'Alaska Airlines',
  'B6': 'JetBlue Airways',
  'F9': 'Frontier Airlines',
  'NK': 'Spirit Airlines',
  'G4': 'Allegiant Air',
  'SY': 'Sun Country Airlines',
  'HA': 'Hawaiian Airlines',
  
  // Middle East Airlines
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'SV': 'Saudia',
  'GF': 'Gulf Air',
  'KU': 'Kuwait Airways',
  'RJ': 'Royal Jordanian',
  'MS': 'EgyptAir',
  'OM': 'Mongolian Airlines',
  
  // European Airlines
  'AF': 'Air France',
  'LH': 'Lufthansa',
  'BA': 'British Airways',
  'KL': 'KLM Royal Dutch Airlines',
  'IB': 'Iberia',
  'AZ': 'ITA Airways',
  'SN': 'Brussels Airlines',
  'LX': 'Swiss International Air Lines',
  'OS': 'Austrian Airlines',
  'SK': 'SAS Scandinavian Airlines',
  'TP': 'TAP Air Portugal',
  'AY': 'Finnair',
  'LO': 'LOT Polish Airlines',
  'OK': 'Czech Airlines',
  'TK': 'Turkish Airlines',
  'A3': 'Aegean Airlines',
  'FR': 'Ryanair',
  'U2': 'easyJet',
  'VY': 'Vueling',
  'EW': 'Eurowings',
  
  // Asian Airlines
  'AI': 'Air India',
  'SG': 'SpiceJet',
  '6E': 'IndiGo',
  '9W': 'Jet Airways',
  'IX': 'Air India Express',
  'G8': 'Go First',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'TG': 'Thai Airways',
  'MH': 'Malaysia Airlines',
  'GA': 'Garuda Indonesia',
  'JL': 'Japan Airlines',
  'NH': 'All Nippon Airways',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'CI': 'China Airlines',
  'BR': 'EVA Air',
  'PR': 'Philippine Airlines',
  '5J': 'Cebu Pacific',
  'VN': 'Vietnam Airlines',
  'QF': 'Qantas',
  'JQ': 'Jetstar Airways',
  'VA': 'Virgin Australia',
  
  // African Airlines
  'ET': 'Ethiopian Airlines',
  'SA': 'South African Airways',
  'KQ': 'Kenya Airways',
  'WB': 'RwandAir',
  'AT': 'Royal Air Maroc',
  
  // Latin American Airlines
  'LA': 'LATAM Airlines',
  'AV': 'Avianca',
  'CM': 'Copa Airlines',
  'AR': 'Aerolíneas Argentinas',
  'AM': 'Aeroméxico',
  'VB': 'VivaAerobus',
  'VB': 'Volaris',
  
  // Canadian Airlines
  'AC': 'Air Canada',
  'WS': 'WestJet',
  
  // Other Major Airlines
  'VS': 'Virgin Atlantic',
  'NZ': 'Air New Zealand',
  'FJ': 'Fiji Airways',
  'WY': 'Oman Air',
  'UL': 'SriLankan Airlines',
  'BG': 'Biman Bangladesh Airlines',
  'PK': 'Pakistan International Airlines',
  'PG': 'Bangkok Airways',
  'MI': 'SilkAir',
  'TR': 'Tigerair',
  '3K': 'Jetstar Asia',
  'FD': 'Thai AirAsia',
  'AK': 'AirAsia',
  'D7': 'AirAsia X',
  'Z2': 'AirAsia Zest',
  'QZ': 'Indonesia AirAsia',
  'I5': 'AirAsia India',
  'XJ': 'Thai AirAsia X',
  
  // Low Cost Carriers
  'NK': 'Spirit Airlines',
  'F9': 'Frontier Airlines',
  'G4': 'Allegiant Air',
  'SY': 'Sun Country Airlines',
  
  // Regional Airlines
  'YX': 'Republic Airways',
  'MQ': 'Envoy Air',
  'OH': 'PSA Airlines',
  '9E': 'Endeavor Air',
  'OO': 'SkyWest Airlines',
  'YV': 'Mesa Airlines',
  'QX': 'Horizon Air',
  '9K': 'Cape Air',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleTimeString('en-US', options);
}

function getAirlineName(code: string): string {
  return AIRLINE_NAMES[code] || code;
}

async function displayFlights(
  parameters: Record<string, any>,
  _context: Record<string, any>
): Promise<ToolResult> {
  try {
    console.log('[DISPLAY_FLIGHTS_TOOL] Formatting flights for UI display');

    const flightData = parameters.flight_data;

    if (!flightData) {
      return {
        status: 'error',
        message: 'Missing required parameter: flight_data',
        error: 'Validation failed',
      };
    }

    // Handle both direct flight data and tool result format
    const flights = flightData.data || flightData.flights || (Array.isArray(flightData) ? flightData : []);

    if (!Array.isArray(flights) || flights.length === 0) {
      return {
        status: 'error',
        message: 'No flight data provided or empty flight array',
        error: 'No flights to display',
      };
    }

    // Find cheapest flight for best value indicator
    const cheapestPrice = Math.min(
      ...flights.map((f: any) => {
        const price = typeof f.price === 'object' ? f.price.total : f.price;
        return typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
      })
    );

    // Format flights for UI
    const formattedFlights = flights.map((flight: any) => {
      // Extract price
      let price: string;
      if (typeof flight.price === 'object') {
        const total = flight.price.total || 0;
        const currency = flight.price.currency || 'USD';
        price = `${currency === 'USD' ? '$' : currency}${total}`;
      } else {
        price = typeof flight.price === 'string' ? flight.price : `$${flight.price || 0}`;
      }

      // Extract outbound flight info
      const outbound = flight.outbound || flight.itineraries?.[0];
      const outboundSegments = outbound?.segments || [];
      const firstOutboundSegment = outboundSegments[0];
      const lastOutboundSegment = outboundSegments[outboundSegments.length - 1];

      if (!firstOutboundSegment || !lastOutboundSegment) {
        console.warn('[DISPLAY_FLIGHTS_TOOL] Missing outbound segment data');
        return null;
      }

      // Extract return flight info (if exists)
      const returnFlight = flight.return || flight.itineraries?.[1];
      const returnSegments = returnFlight?.segments || [];
      const firstReturnSegment = returnSegments[0];
      const lastReturnSegment = returnSegments[returnSegments.length - 1];

      // Get airline code from first segment
      const airlineCode = firstOutboundSegment.airline || firstOutboundSegment.carrierCode || 'UNKNOWN';
      const airlineName = getAirlineName(airlineCode);

      // Format outbound
      const departureTime = firstOutboundSegment.departure?.time || firstOutboundSegment.departure?.at;
      const arrivalTime = lastOutboundSegment.arrival?.time || lastOutboundSegment.arrival?.at;

      if (!departureTime || !arrivalTime) {
        console.warn('[DISPLAY_FLIGHTS_TOOL] Missing departure/arrival times');
        return null;
      }

      const formatted: any = {
        airline: airlineName,
        departure: {
          date: formatDate(departureTime),
          time: formatTime(departureTime),
        },
        arrival: {
          date: formatDate(arrivalTime),
          time: formatTime(arrivalTime),
        },
        price: price,
        isBestValue: false,
      };

      // Add return flight if exists
      if (firstReturnSegment && lastReturnSegment) {
        const returnDepartureTime = firstReturnSegment.departure?.time || firstReturnSegment.departure?.at;
        const returnArrivalTime = lastReturnSegment.arrival?.time || lastReturnSegment.arrival?.at;

        if (returnDepartureTime && returnArrivalTime) {
          formatted.returnFlight = {
            departure: {
              date: formatDate(returnDepartureTime),
              time: formatTime(returnDepartureTime),
            },
            arrival: {
              date: formatDate(returnArrivalTime),
              time: formatTime(returnArrivalTime),
            },
          };
        }
      }

      // Mark as best value if cheapest
      const flightPrice = typeof flight.price === 'object' 
        ? flight.price.total 
        : parseFloat(String(flight.price || 0).replace(/[^0-9.]/g, ''));
      if (Math.abs(flightPrice - cheapestPrice) < 0.01) {
        formatted.isBestValue = true;
      }

      return formatted;
    }).filter((f: any) => f !== null);

    if (formattedFlights.length === 0) {
      return {
        status: 'error',
        message: 'No valid flights could be formatted',
        error: 'Formatting failed',
      };
    }

    return {
      status: 'success',
      data: formattedFlights,
      message: `Formatted ${formattedFlights.length} flight(s) for UI display`,
      metadata: {
        provider: 'display_flights',
        timestamp: new Date().toISOString(),
        count: formattedFlights.length,
      },
    };
  } catch (error: any) {
    console.error('[DISPLAY_FLIGHTS_TOOL] Error:', error);
    return {
      status: 'error',
      message: `Failed to format flights: ${error.message}`,
      error: error.toString(),
    };
  }
}

// Register the tool
toolRegistry.register(displayFlightsToolMetadata, displayFlights);

export { displayFlights, displayFlightsToolMetadata };
