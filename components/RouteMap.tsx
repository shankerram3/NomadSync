import React, { useMemo, useEffect, useRef, useState } from 'react';
import { GroundingChunk } from '../types';

interface RouteMapProps {
  groundingChunks?: GroundingChunk[];
  locations?: string[];
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
    googleMapsLoaded: boolean;
    onGoogleMapsReady: (() => void) | null;
  }
}

export const RouteMap: React.FC<RouteMapProps> = ({ groundingChunks, locations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Extract place IDs from grounding chunks
  const placeIds = useMemo(() => {
    const ids: string[] = [];
    if (groundingChunks) {
      groundingChunks.forEach(chunk => {
        if (chunk.maps?.placeId) {
          ids.push(chunk.maps.placeId);
        }
      });
    }
    return ids;
  }, [groundingChunks]);

  // If we have place IDs, create a map with markers
  if (placeIds.length === 0 && (!locations || locations.length === 0)) {
    return null;
  }

  // Clean and deduplicate locations
  // Also filter out any location that looks like coordinates, current location, or invalid text
  const cleanLocations = useMemo(() => {
    if (!locations || locations.length === 0) return [];
    
    const cleaned: string[] = [];
    const seen = new Set<string>();
    
    // Words/phrases that are NOT location names
    const invalidLocationWords = [
      'route', 'scenic stops', 'scenic stop', 'stops', 'stop',
      'waypoint', 'destination', 'origin', 'start', 'end',
      'directions', 'map', 'location', 'place', 'places'
    ];
    
    locations.forEach(loc => {
      const trimmed = loc.trim();
      
      // Skip if it looks like coordinates (lat,lng format)
      if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(trimmed)) {
        return; // Skip coordinate strings
      }
      
      // Skip if it's a very short string (likely not a location name)
      if (trimmed.length < 2) {
        return;
      }
      
      // Skip if it's clearly not a location name
      const lowerTrimmed = trimmed.toLowerCase();
      if (invalidLocationWords.some(word => lowerTrimmed === word || lowerTrimmed.includes(` ${word}`) || lowerTrimmed.startsWith(`${word} `))) {
        return; // Skip invalid location words
      }
      
      // Skip if it contains only common words (like "Route" or "Scenic Stops")
      if (/^(route|scenic|stops?|waypoint|destination|origin)$/i.test(trimmed)) {
        return;
      }
      
      // Skip if it's a combination phrase that's not a real location (e.g., "Monterey & Carmel-by-the-Sea" should be split)
      // But keep valid locations with "&" or "/" if they're actual place names
      // Skip phrases that are clearly descriptive (contain "Route", "Stops", etc.)
      if (/\b(route|scenic|stops?|waypoint)\b/i.test(trimmed)) {
        return;
      }
      
      const normalized = trimmed.toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        cleaned.push(trimmed);
      }
    });
    
    return cleaned;
  }, [locations]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        setMapError(true);
        setIsLoading(false);
        return;
      }

      try {
        // Create map with Map ID for AdvancedMarkerElement support
        // Note: For production, you should create a Map ID in Google Cloud Console
        // For now, we'll use a demo ID - AdvancedMarkerElement may show warnings but will still work
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: cleanLocations.length > 1 ? 7 : 13,
          center: { lat: 37.7749, lng: -122.4194 }, // Default to SF
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapId: 'NOMADSYNC_MAP', // Map ID for AdvancedMarkerElement (create proper one in Google Cloud Console for production)
        });

        // Initialize Directions Service and Renderer
        const service = new window.google.maps.DirectionsService();
        const renderer = new window.google.maps.DirectionsRenderer({
          map: newMap,
          suppressMarkers: true, // We'll add custom markers
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          },
          preserveViewport: false,
        });

        setMap(newMap);
        setDirectionsService(service);
        setDirectionsRenderer(renderer);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(true);
        setIsLoading(false);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Wait for Google Maps to load
      window.onGoogleMapsReady = initMap;
      if (window.googleMapsLoaded) {
        initMap();
      }
    }

    return () => {
      window.onGoogleMapsReady = null;
    };
  }, []);

  // Load route and display markers/polylines
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || cleanLocations.length === 0) {
      return;
    }

    const loadRoute = async () => {
      try {
        // Clear existing markers
        markers.forEach(marker => {
          if (marker && marker.map) {
            marker.map = null; // AdvancedMarkerElement uses map property, not setMap()
          }
        });
        setMarkers([]);

        if (cleanLocations.length >= 2) {
          // Multiple locations - get directions
          const origin = cleanLocations[0];
          const destination = cleanLocations[cleanLocations.length - 1];
          const waypointLocations = cleanLocations.slice(1, -1);
          
          // Google Maps allows max 25 waypoints
          const maxWaypoints = 25;
          const limitedWaypoints = waypointLocations.slice(0, maxWaypoints).map(loc => ({
            location: loc,
            stopover: true,
          }));

          // Don't optimize - keep waypoints in the order provided to maintain logical route order
          const tryRoute = (optimize: boolean) => {
            const request: any = {
              origin: origin,
              destination: destination,
              travelMode: window.google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false, // Keep original order - don't optimize
            };

            if (limitedWaypoints.length > 0) {
              request.waypoints = limitedWaypoints;
            }

            directionsService.route(request, (result: any, status: any) => {
              if (status === window.google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(result);
              
              // Add custom markers for all waypoints in order using AdvancedMarkerElement
              const route = result.routes[0];
              const allMarkers: any[] = [];
              
              // Helper to create marker element
              const createMarkerElement = (color: string, size: number) => {
                const element = document.createElement('div');
                element.style.width = `${size}px`;
                element.style.height = `${size}px`;
                element.style.borderRadius = '50%';
                element.style.backgroundColor = color;
                element.style.border = '3px solid white';
                element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                return element;
              };
              
              // Start marker (first leg start)
              const firstLeg = route.legs[0];
              const startElement = createMarkerElement('#22c55e', 20);
              const startMarker = new window.google.maps.marker.AdvancedMarkerElement({
                position: firstLeg.start_location,
                map: map,
                content: startElement,
                title: `Start: ${cleanLocations[0]}`,
                zIndex: 1000,
              });
              allMarkers.push(startMarker);
              
              // Waypoint markers (each leg end, except the last one)
              // Since optimization is disabled, waypoints are in the order provided
              route.legs.forEach((leg: any, legIndex: number) => {
                if (legIndex < route.legs.length - 1) {
                  // Waypoints are in order: leg 0 ends at waypoint 0, leg 1 ends at waypoint 1, etc.
                  const waypointIndex = legIndex; // First waypoint is at index 0 (after origin)
                  const locationName = cleanLocations[waypointIndex + 1]; // +1 because first is origin
                  
                  const waypointElement = createMarkerElement('#3b82f6', 16);
                  const waypointMarker = new window.google.maps.marker.AdvancedMarkerElement({
                    position: leg.end_location,
                    map: map,
                    content: waypointElement,
                    title: `Stop ${legIndex + 1}: ${locationName}`,
                    zIndex: 500,
                  });
                  allMarkers.push(waypointMarker);
                }
              });
              
              // End marker (last leg end)
              const lastLeg = route.legs[route.legs.length - 1];
              const endElement = createMarkerElement('#ef4444', 20);
              const endMarker = new window.google.maps.marker.AdvancedMarkerElement({
                position: lastLeg.end_location,
                map: map,
                content: endElement,
                title: `End: ${cleanLocations[cleanLocations.length - 1]}`,
                zIndex: 1000,
              });
              allMarkers.push(endMarker);

              setMarkers(allMarkers);

              // Fit map to show entire route
              const bounds = result.routes[0].bounds;
              map.fitBounds(bounds);
              } else {
                console.error('Directions request failed:', status);
                console.error('Request details:', {
                  origin,
                  destination,
                  waypointsCount: limitedWaypoints.length,
                  waypoints: limitedWaypoints.map(w => w.location),
                  cleanLocations
                });
                
                // Provide helpful error message
                if (status === window.google.maps.DirectionsStatus.NOT_FOUND) {
                  console.error('NOT_FOUND error - This usually means:');
                  console.error('1. One or more location names could not be found');
                  console.error('2. Location names are too ambiguous');
                  console.error('3. Some locations may need more context (e.g., "San Francisco, CA" instead of "SF")');
                  console.error('Trying to geocode locations individually and show markers...');
                }
                
                // Fallback: show markers for all locations
                showMarkersOnly();
              }
            });
          };

          // Try route without optimization to maintain order
          tryRoute(false);
        } else if (cleanLocations.length === 1) {
          // Single location - show marker
          showSingleLocation();
        }
      } catch (error) {
        console.error('Error loading route:', error);
        showMarkersOnly();
      }
    };

    const showSingleLocation = () => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: cleanLocations[0] }, (results: any, status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(13);
          
          const markerElement = document.createElement('div');
          markerElement.style.width = '20px';
          markerElement.style.height = '20px';
          markerElement.style.borderRadius = '50%';
          markerElement.style.backgroundColor = '#3b82f6';
          markerElement.style.border = '3px solid white';
          markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: results[0].geometry.location,
            map: map,
            content: markerElement,
            title: cleanLocations[0],
          });
          setMarkers([marker]);
        } else {
          console.error('Geocoding failed:', status);
          setMapError(true);
        }
      });
    };

    const showMarkersOnly = () => {
      const geocoder = new window.google.maps.Geocoder();
      const bounds = new window.google.maps.LatLngBounds();
      const positionsByIndex: (any | null)[] = new Array(cleanLocations.length).fill(null);
      const markersByIndex: (any | null)[] = new Array(cleanLocations.length).fill(null);

      // Helper to create marker element
      const createMarkerElement = (color: string, size: number) => {
        const element = document.createElement('div');
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.borderRadius = '50%';
        element.style.backgroundColor = color;
        element.style.border = '2px solid white';
        element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        return element;
      };

      let geocodeCount = 0;
      cleanLocations.forEach((location, index) => {
        geocoder.geocode({ address: location }, (results: any, status: any) => {
          geocodeCount++;
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            const position = results[0].geometry.location;
            bounds.extend(position);
            positionsByIndex[index] = position;

            const color = index === 0 ? '#22c55e' : index === cleanLocations.length - 1 ? '#ef4444' : '#3b82f6';
            const size = index === 0 || index === cleanLocations.length - 1 ? 20 : 16;
            const markerElement = createMarkerElement(color, size);
            
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: position,
              map: map,
              content: markerElement,
              title: location,
            });
            markersByIndex[index] = marker;
          }

          if (geocodeCount === cleanLocations.length) {
            const orderedPositions = positionsByIndex.filter(p => p !== null);
            const orderedMarkers = markersByIndex.filter(m => m !== null);
            
            if (orderedPositions.length > 1) {
              const polyline = new window.google.maps.Polyline({
                path: orderedPositions,
                geodesic: true,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              });
              polyline.setMap(map);
            }
            
            if (bounds.getNorthEast().lat() !== bounds.getSouthWest().lat()) {
              map.fitBounds(bounds);
            }
            setMarkers(orderedMarkers);
          }
        });
      });
    };

    loadRoute();
  }, [map, directionsService, directionsRenderer, cleanLocations]);

  // Create a route map URL for opening in Google Maps (fallback link)
  const createRouteMapUrl = useMemo(() => {
    if (cleanLocations && cleanLocations.length >= 2) {
      const waypoints = cleanLocations.map(loc => encodeURIComponent(loc)).join('/');
      return `https://www.google.com/maps/dir/${waypoints}`;
    } else if (cleanLocations && cleanLocations.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanLocations[0])}`;
    } else if (placeIds.length > 0 && groundingChunks) {
      const firstPlace = groundingChunks.find(c => c.maps?.uri);
      if (firstPlace?.maps?.uri) {
        return firstPlace.maps.uri;
      }
    }
    return null;
  }, [placeIds, cleanLocations, groundingChunks]);

  if (!createRouteMapUrl && !mapRef.current) {
    return null;
  }

  return (
    <div className="w-full mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h3 className="font-semibold text-sm text-slate-700">Route Map</h3>
        {isLoading && (
          <span className="text-xs text-slate-500 ml-auto">Loading map...</span>
        )}
      </div>
      <div className="relative w-full bg-slate-100 rounded-b-xl overflow-hidden" style={{ height: '400px' }}>
        {mapError ? (
          // Fallback: Visual route preview if map fails
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex flex-col">
            <div className="flex-1 relative flex items-center justify-center">
              <div className="w-full max-w-2xl">
                {cleanLocations && cleanLocations.length >= 2 && (
                  <div className="relative mb-8">
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full transform -translate-y-1/2"></div>
                    <div className="relative flex justify-between items-center">
                      {cleanLocations.map((location, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full border-4 border-white shadow-lg z-10 ${
                            index === 0 ? 'bg-green-500' : 
                            index === cleanLocations.length - 1 ? 'bg-red-500' : 
                            'bg-blue-500'
                          }`}></div>
                          <div className="mt-2 text-center max-w-[120px]">
                            <p className="text-xs font-semibold text-slate-700 leading-tight">
                              {location.length > 15 ? `${location.substring(0, 15)}...` : location}
                            </p>
                            {index === 0 && <span className="text-[10px] text-green-600 font-medium">Start</span>}
                            {index === cleanLocations.length - 1 && <span className="text-[10px] text-red-600 font-medium">End</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {cleanLocations && cleanLocations.length === 1 && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 rounded-full bg-blue-500 border-4 border-white shadow-xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-slate-800 text-center px-4">
                      {cleanLocations[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {createRouteMapUrl && (
              <div className="flex justify-center pb-2">
                <a
                  href={createRouteMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold text-sm shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  View Full Route on Google Maps
                </a>
              </div>
            )}
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
        )}
      </div>
      {createRouteMapUrl && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <a
            href={createRouteMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            Open full route in Google Maps →
          </a>
        </div>
      )}
    </div>
  );
};
