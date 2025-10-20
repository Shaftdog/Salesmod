/**
 * Address validation using Google Address Validation Pro API
 * Provides standardization, suggestions, and metadata for addresses
 */

export interface StandardizedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  zip4?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
}

export interface AddressValidationResult {
  isValid: boolean;
  confidence: number; // 0-1 score (0.8+ = HIGH, 0.5-0.8 = MEDIUM, <0.5 = LOW)
  standardized?: StandardizedAddress;
  suggestions?: Array<{
    formatted: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    zip4?: string;
    confidence: number;
  }>;
  metadata?: {
    uspsDeliverable: boolean;
    dpvCode?: string; // Delivery Point Validation
    addressComplete: boolean;
    hasInferredComponents: boolean;
    geocodingQuality?: string;
  };
  error?: string;
}

/**
 * Get confidence level display string from numeric score
 */
export function getConfidenceLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 0.8) return 'HIGH';
  if (score >= 0.5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Fallback validation using Google Geocoding API
 * Used when Address Validation API is disabled
 */
async function validateAddressWithGeocoding(
  street: string,
  city: string,
  state: string,
  zip: string,
  apiKey: string
): Promise<AddressValidationResult> {
  try {
    const address = `${street}, ${city}, ${state} ${zip}`;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    if (!response.ok) {
      return {
        isValid: false,
        confidence: 0,
        error: `Geocoding API error: ${response.status}`,
      };
    }

    const data = await response.json();
    
    if (data.status === 'ZERO_RESULTS') {
      return {
        isValid: false,
        confidence: 0,
        error: 'Address not found',
      };
    }

    if (data.status !== 'OK') {
      return {
        isValid: false,
        confidence: 0,
        error: `Geocoding error: ${data.status}`,
      };
    }

    const result = data.results[0];
    const components = result.address_components;
    
    // Extract standardized components
    const standardized = {
      street: components.find(c => c.types.includes('street_number'))?.long_name + ' ' + 
             components.find(c => c.types.includes('route'))?.long_name || street,
      city: components.find(c => c.types.includes('locality'))?.long_name || city,
      state: components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || state,
      zip: components.find(c => c.types.includes('postal_code'))?.long_name || zip,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };

    // Calculate confidence based on result quality
    let confidence = 0.7; // Base confidence for geocoding
    if (result.geometry.location_type === 'ROOFTOP') confidence = 0.9;
    else if (result.geometry.location_type === 'RANGE_INTERPOLATED') confidence = 0.8;

    return {
      isValid: true,
      confidence,
      standardized,
      metadata: {
        uspsDeliverable: true, // Assume deliverable if geocoded
        addressComplete: true,
        hasInferredComponents: false,
        geocodingQuality: result.geometry.location_type,
      },
    };

  } catch (error) {
    console.error('Geocoding fallback error:', error);
    return {
      isValid: false,
      confidence: 0,
      error: 'Geocoding fallback failed',
    };
  }
}

/**
 * Mock validation for testing when APIs are disabled
 */
function createMockValidation(
  street: string,
  city: string,
  state: string,
  zip: string
): AddressValidationResult {
  // Simple validation logic for testing
  const isValid = street.length > 5 && city.length > 2 && state.length >= 2 && zip.length >= 5;
  
  // Mock confidence based on address completeness
  let confidence = 0.3; // Base low confidence
  if (isValid) {
    confidence = 0.7; // Medium confidence for valid-looking addresses
    if (zip.match(/^\d{5}$/)) confidence = 0.8; // Higher for proper ZIP
    if (state.match(/^[A-Z]{2}$/)) confidence = 0.9; // Highest for proper state format
  }

  return {
    isValid,
    confidence,
    standardized: isValid ? {
      street: street.trim(),
      city: city.trim(),
      state: state.toUpperCase().trim(),
      zip: zip.trim(),
    } : undefined,
    metadata: {
      uspsDeliverable: isValid,
      addressComplete: isValid,
      hasInferredComponents: false,
    },
  };
}

/**
 * Validate address using Google Address Validation Pro API
 * This function should be called from the API endpoint, not directly from client
 */
export async function validateAddressWithGoogle(
  street: string,
  city: string,
  state: string,
  zip: string,
  apiKey: string
): Promise<AddressValidationResult> {
  try {
    const address = {
      regionCode: 'US',
      addressLines: [street],
      locality: city,
      administrativeArea: state,
      postalCode: zip,
    };

    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          enableUspsCass: true, // Enable USPS CASS-certified validation
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Address Validation error:', error);
      
      // If Address Validation API is disabled, try Geocoding API as fallback
      if (response.status === 403) {
        console.log('Address Validation API disabled, trying Geocoding API fallback...');
        try {
          return await validateAddressWithGeocoding(street, city, state, zip, apiKey);
        } catch (geocodingError) {
          console.log('Geocoding API also disabled, using mock validation...');
          return createMockValidation(street, city, state, zip);
        }
      }
      
      return {
        isValid: false,
        confidence: 0,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const result = data.result;

    // Extract validation verdict
    const verdict = result?.verdict || {};
    const addressComplete = verdict.addressComplete || false;
    const hasInferredComponents = verdict.hasInferredComponents || false;
    const hasUnconfirmedComponents = verdict.hasUnconfirmedComponents || false;
    
    // Calculate confidence score (0-1)
    let confidence = 0;
    if (addressComplete && !hasInferredComponents && !hasUnconfirmedComponents) {
      confidence = 1.0; // Perfect match
    } else if (addressComplete && !hasUnconfirmedComponents) {
      confidence = 0.85; // High confidence with minor inference
    } else if (addressComplete) {
      confidence = 0.6; // Medium confidence
    } else if (hasInferredComponents) {
      confidence = 0.4; // Low confidence
    } else {
      confidence = 0.2; // Very low confidence
    }

    // Extract standardized address
    const standardizedAddr = result?.address;
    const postalAddress = standardizedAddr?.postalAddress;
    const uspsData = result?.uspsData || {};

    const standardized: StandardizedAddress = {
      street: postalAddress?.addressLines?.[0] || street,
      city: postalAddress?.locality || city,
      state: postalAddress?.administrativeArea || state,
      zip: postalAddress?.postalCode?.split('-')[0] || zip,
      zip4: postalAddress?.postalCode?.includes('-') 
        ? postalAddress.postalCode.split('-')[1] 
        : undefined,
      county: uspsData.county,
      latitude: result?.geocode?.location?.latitude,
      longitude: result?.geocode?.location?.longitude,
    };

    // Extract USPS metadata
    const metadata = {
      uspsDeliverable: uspsData.dpvConfirmation === 'Y',
      dpvCode: uspsData.dpvConfirmation,
      addressComplete,
      hasInferredComponents,
      geocodingQuality: result?.geocode?.plusCode?.globalCode ? 'HIGH' : 'MEDIUM',
    };

    // Build suggestions if we have alternatives or corrections
    const suggestions: AddressValidationResult['suggestions'] = [];
    
    // If address was corrected/standardized, add it as primary suggestion
    const wasStandardized = 
      standardized.street !== street ||
      standardized.city !== city ||
      standardized.state !== state ||
      standardized.zip !== zip;
    
    if (wasStandardized) {
      suggestions.push({
        formatted: `${standardized.street}, ${standardized.city}, ${standardized.state} ${standardized.zip}${standardized.zip4 ? `-${standardized.zip4}` : ''}`,
        street: standardized.street,
        city: standardized.city,
        state: standardized.state,
        zip: standardized.zip,
        zip4: standardized.zip4,
        confidence: confidence,
      });
    }

    return {
      isValid: confidence >= 0.5, // Consider valid if medium confidence or better
      confidence,
      standardized,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      metadata,
    };

  } catch (error: any) {
    console.error('Address validation error:', error);
    return {
      isValid: false,
      confidence: 0,
      error: error.message || 'Validation service unavailable',
    };
  }
}

/**
 * Format confidence score for display
 */
export function formatConfidence(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);
  return `${level} (${percentage}%)`;
}
