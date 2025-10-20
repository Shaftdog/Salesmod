"use client";

import { useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PropertyMap } from './property-map';

// Lazy load Street View component to improve initial page load
const PropertyStreetView = lazy(() => 
  import('./property-street-view').then(module => ({ default: module.PropertyStreetView }))
);

interface PropertyMapSectionProps {
  latitude?: number;
  longitude?: number;
  address: string;
  propertyId: string;
}

export function PropertyMapSection({ 
  latitude, 
  longitude, 
  address, 
  propertyId 
}: PropertyMapSectionProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    latitude && longitude ? { latitude, longitude } : null
  );
  const { toast } = useToast();

  const handleGeocode = async () => {
    if (isGeocoding) return;

    setIsGeocoding(true);
    
    try {
      const response = await fetch('/api/properties/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      const data = await response.json();

      if (data.success && data.coordinates) {
        setCoordinates(data.coordinates);
        toast({
          title: "Location Found",
          description: "Property coordinates have been successfully determined.",
        });
      } else {
        toast({
          title: "Geocoding Failed",
          description: data.message || "Unable to determine coordinates for this property.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding Error",
        description: "An error occurred while determining the property location.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // If no coordinates available, show geocoding prompt
  if (!coordinates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Property Location</span>
          </CardTitle>
          <CardDescription>
            No coordinates available for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[440px] bg-muted rounded-lg">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No coordinates yet...</h3>
              <p className="text-gray-600 mb-4">
                We need to determine the exact location of this property to show the map.
              </p>
              <Button
                onClick={handleGeocode}
                disabled={isGeocoding}
                className="inline-flex items-center"
              >
                {isGeocoding ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Determining location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Find Location
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Property Location</span>
        </CardTitle>
        <CardDescription>
          {address}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="street">Street View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="mt-4">
            <PropertyMap
              latitude={coordinates.latitude}
              longitude={coordinates.longitude}
              address={address}
            />
          </TabsContent>
          
          <TabsContent value="street" className="mt-4">
            <Suspense fallback={
              <div className="flex items-center justify-center h-[440px] bg-muted rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">Loading Street View...</p>
                </div>
              </div>
            }>
              <PropertyStreetView
                latitude={coordinates.latitude}
                longitude={coordinates.longitude}
                address={address}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
