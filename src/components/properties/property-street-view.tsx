"use client";

import { useState, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin } from 'lucide-react';

interface PropertyStreetViewProps {
  latitude: number;
  longitude: number;
  address: string;
}

export function PropertyStreetView({ latitude, longitude, address }: PropertyStreetViewProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!apiKey || !latitude || !longitude) {
      setIsLoading(false);
      return;
    }

    // Check if Street View is available at this location
    const checkStreetViewAvailability = () => {
      if (!window.google?.maps) {
        setIsLoading(false);
        setIsAvailable(false);
        setError('Google Maps not loaded');
        return;
      }

      const service = new google.maps.StreetViewService();
      const position = { lat: latitude, lng: longitude };
      
      service.getPanorama(
        { location: position, radius: 50 },
        (data, status) => {
          setIsLoading(false);
          if (status === google.maps.StreetViewStatus.OK && data) {
            setIsAvailable(true);
            // Initialize Street View panorama
            initializeStreetView(data.location);
          } else {
            setIsAvailable(false);
            setError('No Street View imagery available for this location');
          }
        }
      );
    };

    const initializeStreetView = (location: google.maps.LatLng) => {
      if (!streetViewRef.current || !window.google?.maps) return;

      try {
        panoramaRef.current = new google.maps.StreetViewPanorama(streetViewRef.current, {
          position: location,
          pov: {
            heading: 0,
            pitch: 0,
          },
          zoom: 1,
          visible: true,
          addressControl: false,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
          showRoadLabels: false
        });
      } catch (err) {
        console.error('Error initializing Street View:', err);
        setError('Failed to load Street View');
        setIsAvailable(false);
      }
    };

    // Wait for Google Maps to be loaded
    if (typeof window !== 'undefined' && window.google?.maps) {
      checkStreetViewAvailability();
    } else {
      // Fallback: assume not available if we can't check
      setIsLoading(false);
      setIsAvailable(false);
      setError('Google Maps not available');
    }
  }, [apiKey, latitude, longitude]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panoramaRef.current) {
        panoramaRef.current = null;
      }
    };
  }, []);

  const openInGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps/@${latitude},${longitude},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s${encodeURIComponent(address)}!2e0!7i13312!8i6656`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[440px] bg-muted rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Checking Street View availability...</p>
        </div>
      </div>
    );
  }

  if (isAvailable === false || error) {
    return (
      <div className="flex items-center justify-center h-[440px] bg-muted rounded-lg">
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Street View Not Available</h3>
          <p className="text-gray-600 mb-4">
            {error || 'Street View imagery is not available for this location. This is common for rural areas or newly constructed properties.'}
          </p>
          <Button
            variant="outline"
            onClick={openInGoogleMaps}
            className="inline-flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Google Maps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[440px] w-full rounded-lg overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <div 
          ref={streetViewRef}
          className="h-full w-full"
          style={{ minHeight: '440px' }}
        />
      </APIProvider>
    </div>
  );
}
