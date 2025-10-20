import { createClient } from '@/lib/supabase/server';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id?: string;
}

interface GeocodeCache {
  [key: string]: {
    result: GeocodeResult;
    timestamp: number;
  };
}

// In-memory cache to avoid quota spikes
const geocodeCache: GeocodeCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function geocodeProperty(propertyId: string): Promise<GeocodeResult | null> {
  const supabase = createClient();
  
  try {
    console.log('Fetching property details for:', propertyId);
    
    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, address_line1, address_line2, city, state, postal_code, country, addr_hash')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property:', propertyError);
      return null;
    }

    console.log('Property details:', property);

    // Create standardized address (building-level, no unit)
    const standardizedAddress = [
      property.address_line1,
      property.address_line2,
      `${property.city}, ${property.state} ${property.postal_code}`,
      property.country
    ].filter(Boolean).join(', ');

    // Check cache first
    const cacheKey = `${property.addr_hash}`;
    const cached = geocodeCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached geocode result for property:', propertyId);
      return cached.result;
    }

    // Geocode using Google Maps API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return null;
    }

    console.log('Geocoding address:', standardizedAddress);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(standardizedAddress)}&key=${apiKey}`;
    console.log('Geocoding URL:', geocodeUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      console.error('Geocoding API request failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Geocoding response status:', data.status);
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding failed:', data.status, data.error_message);
      return null;
    }

    const result = data.results[0];
    const geocodeResult: GeocodeResult = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id
    };

    // Cache the result
    geocodeCache[cacheKey] = {
      result: geocodeResult,
      timestamp: Date.now()
    };

    // Update property with coordinates
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        verification_source: 'google_geocode',
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Error updating property coordinates:', updateError);
      return null;
    }

    console.log('Successfully geocoded and updated property:', propertyId);
    return geocodeResult;

  } catch (error) {
    console.error('Error in geocodeProperty:', error);
    return null;
  }
}

export async function getPropertyCoordinates(propertyId: string): Promise<{ latitude: number; longitude: number } | null> {
  const supabase = createClient();
  
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('latitude, longitude')
      .eq('id', propertyId)
      .single();

    if (error || !property) {
      console.error('Error fetching property coordinates:', error);
      return null;
    }

    if (property.latitude && property.longitude) {
      return {
        latitude: property.latitude,
        longitude: property.longitude
      };
    }

    return null;
  } catch (error) {
    console.error('Error in getPropertyCoordinates:', error);
    return null;
  }
}
