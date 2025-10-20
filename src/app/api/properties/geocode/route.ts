import { NextRequest, NextResponse } from 'next/server';
import { geocodeProperty, getPropertyCoordinates } from '@/lib/geocode';

export async function POST(request: NextRequest) {
  try {
    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    console.log('Geocoding property:', propertyId);

    // Check if property already has coordinates
    const existingCoords = await getPropertyCoordinates(propertyId);
    if (existingCoords) {
      console.log('Property already has coordinates:', existingCoords);
      return NextResponse.json({
        success: true,
        coordinates: existingCoords,
        message: 'Property already has coordinates'
      });
    }

    console.log('Property needs geocoding, attempting...');

    // Attempt to geocode the property
    const geocodeResult = await geocodeProperty(propertyId);
    
    if (!geocodeResult) {
      console.log('Geocoding failed for property:', propertyId);
      return NextResponse.json(
        { 
          error: 'Failed to geocode property address',
          message: 'Unable to determine coordinates for this property address'
        },
        { status: 422 }
      );
    }

    console.log('Geocoding successful:', geocodeResult);

    return NextResponse.json({
      success: true,
      coordinates: {
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude
      },
      formatted_address: geocodeResult.formatted_address,
      place_id: geocodeResult.place_id
    });

  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while geocoding the property'
      },
      { status: 500 }
    );
  }
}
