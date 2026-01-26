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

    // Collect all unique airline codes from all flights for batch lookup
    const allAirlineCodes = new Set<string>();
    flights.forEach((flight: any) => {
      const outbound = flight.outbound || flight.itineraries?.[0];
      const returnFlight = flight.return || flight.itineraries?.[1];
      
      const outboundSegments = outbound?.segments || [];
      outboundSegments.forEach((seg: any) => {
        const code = seg.airline || seg.carrierCode;
        if (code && code.length === 2) allAirlineCodes.add(code.toUpperCase());
      });
      
      if (returnFlight) {
        const returnSegments = returnFlight.segments || [];
        returnSegments.forEach((seg: any) => {
          const code = seg.airline || seg.carrierCode;
          if (code && code.length === 2) allAirlineCodes.add(code.toUpperCase());
        });
      }
    });

    // Batch fetch all airline names at once
    let airlineNamesMap: Record<string, string> = {};
    try {
      const { amadeusClient } = await import('../amadeus.js');
      airlineNamesMap = await amadeusClient.getAirlineNames(Array.from(allAirlineCodes));
    } catch (error: any) {
      console.warn('[DISPLAY_FLIGHTS_TOOL] Failed to batch fetch airline names:', error.message);
      // Initialize with codes as fallback
      Array.from(allAirlineCodes).forEach(code => {
        airlineNamesMap[code] = code;
      });
    }

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
      
      // Get airline name from the pre-fetched map
      const airlineName = airlineNamesMap[airlineCode.toUpperCase()] || airlineCode;

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
