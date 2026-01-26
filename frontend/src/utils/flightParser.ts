import { FlightInfo } from '../components/FlightCard';

/**
 * Parse flight information from agent response text
 */
export function parseFlightsFromText(text: string): FlightInfo[] {
  const flights: FlightInfo[] = [];
  
  // Pattern to match flight information
  // Example: "### Flight Options:" followed by numbered list
  const flightSectionRegex = /### Flight Options:([\s\S]*?)(?=### Best Value Option:|###|$)/i;
  const flightMatch = text.match(flightSectionRegex);
  
  if (!flightMatch) {
    return flights;
  }
  
  const flightSection = flightMatch[1];
  
  // Pattern to match individual flights (numbered list items)
  // Handles format like:
  // 1. **Airline:** Southwest Airlines
  // **Departure:** January 29, 2024, at 8:00 AM
  // **Arrival:** January 29, 2024, at 9:30 AM
  // **Price:** $89 (one way)
  // **Return:** February 2, 2024, at 6:00 PM
  // **Arrival:** February 2, 2024, at 7:30 PM
  const flightItemRegex = /(\d+)\.\s*\*\*Airline:\*\*\s*([^\n*]+)\s*\*\*Departure:\*\*\s*([^\n*]+)\s*\*\*Arrival:\*\*\s*([^\n*]+)\s*\*\*Price:\*\*\s*([^\n*]+)(?:\s*\*\*Return:\*\*\s*([^\n*]+)\s*\*\*Arrival:\*\*\s*([^\n*]+))?/gi;
  
  let match;
  while ((match = flightItemRegex.exec(flightSection)) !== null) {
    const [, , airline, departureStr, arrivalStr, priceStr, returnDepartureStr, returnArrivalStr] = match;
    
    // Parse departure: "January 29, 2024, at 8:00 AM"
    const departureMatch = departureStr.match(/([^,]+(?:,\s*\d{4})?),\s*at\s*(\d+:\d+\s*(?:AM|PM))/i);
    const arrivalMatch = arrivalStr.match(/([^,]+(?:,\s*\d{4})?),\s*at\s*(\d+:\d+\s*(?:AM|PM))/i);
    
    if (!departureMatch || !arrivalMatch) continue;
    
    const departureDate = departureMatch[1].trim();
    const departureTime = departureMatch[2].trim();
    const arrivalDate = arrivalMatch[1].trim();
    const arrivalTime = arrivalMatch[2].trim();
    
    // Parse return flight if available
    let returnFlight;
    if (returnDepartureStr && returnArrivalStr) {
      const returnDepMatch = returnDepartureStr.match(/([^,]+(?:,\s*\d{4})?),\s*at\s*(\d+:\d+\s*(?:AM|PM))/i);
      const returnArrMatch = returnArrivalStr.match(/([^,]+(?:,\s*\d{4})?),\s*at\s*(\d+:\d+\s*(?:AM|PM))/i);
      
      if (returnDepMatch && returnArrMatch) {
        returnFlight = {
          departure: {
            date: returnDepMatch[1].trim(),
            time: returnDepMatch[2].trim(),
          },
          arrival: {
            date: returnArrMatch[1].trim(),
            time: returnArrMatch[2].trim(),
          },
        };
      }
    }
    
    // Extract price - handle formats like "$89 (one way)" or "$120"
    const priceMatch = priceStr.match(/\$?(\d+)/);
    const price = priceMatch ? `$${priceMatch[1]}` : priceStr.trim();
    
    flights.push({
      airline: airline.trim(),
      departure: {
        date: departureDate,
        time: departureTime,
      },
      arrival: {
        date: arrivalDate,
        time: arrivalTime,
      },
      price: price,
      returnFlight,
    });
  }
  
  // Check for "Best Value" indicator
  const bestValueRegex = /### Best Value Option:[\s\S]*?-\s*\*\*([^*]+)\*\*:/i;
  const bestValueMatch = text.match(bestValueRegex);
  if (bestValueMatch) {
    const bestValueAirline = bestValueMatch[1].trim();
    const bestValueFlight = flights.find(f => 
      f.airline.toLowerCase().includes(bestValueAirline.toLowerCase())
    );
    if (bestValueFlight) {
      bestValueFlight.isBestValue = true;
    }
  }
  
  return flights;
}

/**
 * Check if text contains flight information
 */
export function hasFlightInfo(text: string): boolean {
  return /### Flight Options:/i.test(text) || /flight options/i.test(text);
}
