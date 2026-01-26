/**
 * Flight Booking Tool - Registered with dynamic tool registry
 * Books flights using the Amadeus Flight Orders API
 */
import { toolRegistry, ToolMetadata, ToolResult } from '../tool_registry.js';
import { amadeusClient } from '../amadeus.js';

const flightBookingToolMetadata: ToolMetadata = {
  id: 'flight_booking',
  name: 'Flight Booking',
  description: 'Book flights using flight offers from search results. Requires flight offer data, traveler information, and contact details.',
  agent: 'booking',
  action: 'book_flights',
  category: 'booking',
  parameters: [
    {
      name: 'flight_offer_id',
      type: 'string',
      required: true,
      description: 'ID of the flight offer to book (from flight search results)',
      example: '1',
    },
    {
      name: 'flight_offer_data',
      type: 'object',
      required: true,
      description: 'Complete flight offer object from search results (must match Amadeus FlightOffer format)',
      example: {
        type: 'flight-offer',
        id: '1',
        source: 'GDS',
        itineraries: [],
        price: { currency: 'USD', total: '1200.00' },
      },
    },
    {
      name: 'travelers',
      type: 'array',
      required: true,
      description: 'Array of traveler information (at least one required)',
      example: [
        {
          id: '1',
          dateOfBirth: '1990-01-15',
          name: { firstName: 'John', lastName: 'Doe' },
          gender: 'MALE',
          contact: {
            emailAddress: 'john.doe@example.com',
            phones: [{ deviceType: 'MOBILE', countryCallingCode: '1', number: '5551234567' }],
          },
        },
      ],
    },
    {
      name: 'contact_info',
      type: 'object',
      required: false,
      description: 'Contact information for booking confirmation',
      example: {
        emailAddress: 'john.doe@example.com',
        phones: [{ deviceType: 'MOBILE', countryCallingCode: '1', number: '5551234567' }],
      },
    },
    {
      name: 'ticketing_option',
      type: 'string',
      required: false,
      description: 'Ticketing agreement option: CONFIRM, DELAY_TO_QUEUE, or DELAY_TO_CANCEL',
      example: 'DELAY_TO_CANCEL',
    },
    {
      name: 'ticketing_delay',
      type: 'string',
      required: false,
      description: 'Delay before applying ticketing action (e.g., "6D" for 6 days)',
      example: '6D',
    },
  ],
  examples: [
    {
      input: {
        flight_offer_id: '1',
        flight_offer_data: {
          type: 'flight-offer',
          id: '1',
          source: 'GDS',
          itineraries: [
            {
              segments: [
                {
                  departure: { iataCode: 'JFK', at: '2024-03-15T10:00:00' },
                  arrival: { iataCode: 'NRT', at: '2024-03-16T14:30:00' },
                  carrierCode: 'JL',
                  number: '4',
                },
              ],
            },
          ],
          price: { currency: 'USD', total: '1200.00' },
        },
        travelers: [
          {
            id: '1',
            dateOfBirth: '1990-01-15',
            name: { firstName: 'John', lastName: 'Doe' },
            gender: 'MALE',
            contact: {
              emailAddress: 'john.doe@example.com',
              phones: [{ deviceType: 'MOBILE', countryCallingCode: '1', number: '5551234567' }],
            },
          },
        ],
      },
      output: {
        status: 'success',
        data: {
          type: 'flight-order',
          id: 'MlpZVkFMfFdBVFNPTnwyMDE1LTExLTAy',
          associatedRecords: [{ reference: 'ABC123', originSystemCode: '1A' }],
        },
        message: 'Flight order created successfully',
      },
    },
  ],
  retryable: false, // Booking should not be retried automatically
  timeout: 60000, // 60 seconds for booking
};

async function bookFlights(
  parameters: Record<string, any>,
  context: Record<string, any>
): Promise<ToolResult> {
  try {
    console.log('[FLIGHT_BOOKING_TOOL] Starting flight booking with parameters:', {
      ...parameters,
      travelers: parameters.travelers?.length || 0,
    });

    // Get flight offer data
    const flightOfferId = parameters.flight_offer_id;
    const flightOfferData = parameters.flight_offer_data;

    if (!flightOfferId || !flightOfferData) {
      return {
        status: 'error',
        message: 'Missing required parameters: flight_offer_id and flight_offer_data are required',
        error: 'Validation failed',
      };
    }

    // Check if we have flight offer in context (from previous search)
    let flightOffer = flightOfferData;
    if (context && context.completed_tasks && context.completed_tasks.search_flights) {
      const searchResults = context.completed_tasks.search_flights.data || [];
      const foundOffer = searchResults.find((f: any) => f.id === flightOfferId);
      if (foundOffer && foundOffer._originalOffer) {
        // Use the preserved original offer from search
        flightOffer = foundOffer._originalOffer;
        console.log('[FLIGHT_BOOKING_TOOL] Using original flight offer from search context');
      } else if (context.completed_tasks.search_flights.metadata?.originalOffers) {
        // Try to find in metadata
        const originalOffers = context.completed_tasks.search_flights.metadata.originalOffers;
        const foundOriginal = originalOffers.find((o: any) => o.id === flightOfferId);
        if (foundOriginal) {
          flightOffer = foundOriginal;
          console.log('[FLIGHT_BOOKING_TOOL] Using original flight offer from metadata');
        }
      }
    }

    // Validate flight offer structure
    if (!flightOffer || !flightOffer.type || flightOffer.type !== 'flight-offer') {
      return {
        status: 'error',
        message: 'Invalid flight offer data. Must be a valid Amadeus FlightOffer object.',
        error: 'Validation failed',
      };
    }

    // Validate travelers
    const travelers = parameters.travelers;
    if (!travelers || !Array.isArray(travelers) || travelers.length === 0) {
      return {
        status: 'error',
        message: 'At least one traveler is required for booking',
        error: 'Validation failed',
      };
    }

    // Validate each traveler has required fields
    for (const traveler of travelers) {
      if (!traveler.id || !traveler.dateOfBirth || !traveler.name || !traveler.name.firstName || !traveler.name.lastName) {
        return {
          status: 'error',
          message: `Traveler ${traveler.id || 'unknown'} is missing required fields: id, dateOfBirth, name.firstName, name.lastName`,
          error: 'Validation failed',
        };
      }
    }

    // Prepare booking request
    const bookingData = {
      flightOffers: [flightOffer],
      travelers: travelers.map((t: any) => ({
        id: t.id,
        dateOfBirth: t.dateOfBirth,
        name: {
          firstName: t.name.firstName,
          lastName: t.name.lastName,
          ...(t.name.middleName && { middleName: t.name.middleName }),
        },
        ...(t.gender && { gender: t.gender }),
        ...(t.contact && {
          contact: {
            emailAddress: t.contact.emailAddress,
            ...(t.contact.phones && { phones: t.contact.phones }),
          },
        }),
        ...(t.documents && { documents: t.documents }),
      })),
      ...(parameters.remarks && { remarks: parameters.remarks }),
      ...(parameters.ticketing_option && {
        ticketingAgreement: {
          option: parameters.ticketing_option,
          ...(parameters.ticketing_delay && { delay: parameters.ticketing_delay }),
        },
      }),
      ...(parameters.contact_info && {
        contacts: [
          {
            ...(parameters.contact_info.addresseeName && {
              addresseeName: parameters.contact_info.addresseeName,
            }),
            ...(parameters.contact_info.companyName && {
              companyName: parameters.contact_info.companyName,
            }),
            purpose: parameters.contact_info.purpose || 'STANDARD',
            ...(parameters.contact_info.phones && { phones: parameters.contact_info.phones }),
            ...(parameters.contact_info.emailAddress && {
              emailAddress: parameters.contact_info.emailAddress,
            }),
            ...(parameters.contact_info.address && { address: parameters.contact_info.address }),
          },
        ],
      }),
    };

    console.log('[FLIGHT_BOOKING_TOOL] Creating flight order...');

    // Call Amadeus API to create flight order
    const bookingResponse = await amadeusClient.createFlightOrder(bookingData);

    if (bookingResponse.data) {
      const order = bookingResponse.data;
      console.log('[FLIGHT_BOOKING_TOOL] Flight order created:', order.id);

      return {
        status: 'success',
        data: {
          orderId: order.id,
          type: order.type,
          associatedRecords: order.associatedRecords || [],
          travelers: order.travelers || [],
          flightOffers: order.flightOffers || [],
          tickets: order.tickets || [],
        },
        message: `Flight order created successfully. Order ID: ${order.id}`,
        metadata: {
          provider: 'Amadeus',
          timestamp: new Date().toISOString(),
          orderId: order.id,
        },
      };
    } else {
      return {
        status: 'error',
        message: 'Flight booking response did not contain order data',
        error: 'Invalid response format',
      };
    }
  } catch (error: any) {
    console.error('[FLIGHT_BOOKING_TOOL] Error:', error);
    return {
      status: 'error',
      message: `Flight booking failed: ${error.message}`,
      error: error.toString(),
    };
  }
}

// Register the tool
toolRegistry.register(flightBookingToolMetadata, bookFlights);

export { bookFlights, flightBookingToolMetadata };
