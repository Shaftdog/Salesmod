"use client";

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { MapPin, Satellite } from 'lucide-react';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

export function PropertyMap({ latitude, longitude, address }: PropertyMapProps) {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load map type preference from localStorage
  useEffect(() => {
    const savedMapType = localStorage.getItem('property-map-type') as 'roadmap' | 'satellite';
    if (savedMapType) {
      setMapType(savedMapType);
    }
  }, []);

  // Save map type preference to localStorage
  const handleMapTypeToggle = () => {
    const newMapType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(newMapType);
    localStorage.setItem('property-map-type', newMapType);
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[440px] bg-muted rounded-lg">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Google Maps API key is missing.</p>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="flex items-center justify-center h-[440px] bg-muted rounded-lg">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No coordinates available for this property.</p>
        </div>
      </div>
    );
  }

  const position = { lat: latitude, lng: longitude };

  return (
    <div className="relative h-[440px] w-full rounded-lg overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={position}
          defaultZoom={16}
          mapId="property-map"
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <AdvancedMarker position={position} title={address} />
        </Map>
      </APIProvider>
      
      {/* Map Type Toggle Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMapTypeToggle}
          className="bg-white/90 hover:bg-white shadow-md"
        >
          {mapType === 'roadmap' ? (
            <>
              <Satellite className="h-4 w-4 mr-2" />
              Satellite
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Street
            </>
          )}
        </Button>
      </div>
    </div>
  );
}