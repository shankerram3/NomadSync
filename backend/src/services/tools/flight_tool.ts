/**
 * Flight Search Tool - Registered with dynamic tool registry
 */
import { toolRegistry, ToolMetadata, ToolResult } from '../tool_registry.js';
import { amadeusClient, formatFlightResults } from '../amadeus.js';
import { resolveAirportCode, formatDate } from '../flight_tools.js';

const flightToolMetadata: ToolMetadata = {
  id: 'flight_search',
  name: 'Flight Search',
  description: 'Search for available flights between airports or cities using the Amadeus API. Supports round-trip and one-way flights.',
  agent: 'research',
  action: 'search_flights',
  category: 'research',
  parameters: [
    {
      name: 'origin',
      type: 'string',
      required: true,
      description: 'Departure city or airport code (e.g., "New York", "JFK", "NYC")',
      example: 'New York',
    },
    {
      name: 'destination',
      type: 'string',
      required: true,
      description: 'Arrival city or airport code (e.g., "Tokyo", "NRT")',
      example: 'Tokyo',
    },
    {
      name: 'departure_date',
      type: 'date',
      required: true,
      description: 'Departure date in YYYY-MM-DD format',
      example: '2024-03-15',
    },
    {
      name: 'return_date',
      type: 'date',
      required: false,
      description: 'Return date in YYYY-MM-DD format (for round-trip flights)',
      example: '2024-03-22',
    },
    {
      name: 'passengers',
      type: 'number',
      required: false,
      description: 'Number of passengers (default: 1)',
      example: 2,
    },
    {
      name: 'currency',
      type: 'string',
      required: false,
      description: 'Currency code for pricing (default: USD)',
      example: 'USD',
    },
  ],
  examples: [
    {
      input: {
        origin: 'New York',
        destination: 'Tokyo',
        departure_date: '2024-03-15',
        passengers: 2,
      },
      output: {
        status: 'success',
        data: [{ id: '...', price: { total: 1200, currency: 'USD' }, ... }],
        count: 10,
      },
    },
  ],
  retryable: true,
  timeout: 30000, // 30 seconds
};

async function searchFlights(
  parameters: Record<string, any>,
  _context: Record<string, any>
): Promise<ToolResult> {
  try {
    console.log('[FLIGHT_TOOL] Starting flight search with parameters:', parameters);

    const origin = parameters.origin;
    const destination = parameters.destination;
    const departureDate = parameters.departure_date || parameters.departureDate;
    const returnDate = parameters.return_date || parameters.returnDate;
    const passengers = parameters.passengers || parameters.group_size || 1;
    const currency = parameters.currency || 'USD';

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return {
        status: 'error',
        message: 'Missing required parameters: origin, destination, and departure_date are required',
        error: 'Validation failed',
      };
    }

    // Resolve airport codes (dynamic lookup)
    const originCode = await resolveAirportCode(origin);
    const destCode = await resolveAirportCode(destination);

    if (!originCode || !destCode) {
      const missing = [];
      if (!originCode) missing.push(`Origin: ${origin}`);
      if (!destCode) missing.push(`Destination: ${destination}`);
      
      return {
        status: 'error',
        message: `Could not determine airport codes for: ${missing.join(', ')}`,
        error: 'Airport code resolution failed',
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
      currency,
    });

    // Format results
    const formatted = formatFlightResults(flightData);

    return {
      status: formatted.status === 'success' ? 'success' : 'partial',
      data: formatted.flights,
      message: formatted.message || `Found ${formatted.flights.length} flight options`,
      metadata: {
        provider: 'Amadeus',
        timestamp: new Date().toISOString(),
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

// Register the tool
toolRegistry.register(flightToolMetadata, searchFlights);

export { searchFlights, flightToolMetadata };
