
"use client"

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

type OrderMapProps = {
    address: string;
};

// This is a simplified implementation that relies on client-side geocoding.
// For production, you would want to geocode the address on the server
// and pass the latitude and longitude to this component.
// We are hardcoding a location for now.
const fakeGeocodedLocation = {
    lat: 37.7749,
    lng: -122.4194,
};


export function OrderMap({ address }: OrderMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Google Maps API key is missing.</p>
            </div>
        );
    }
    
    return (
        <APIProvider apiKey={apiKey}>
            <div className="h-full w-full rounded-lg overflow-hidden">
                <Map
                    defaultCenter={fakeGeocodedLocation}
                    defaultZoom={14}
                    mapId="a3bbf35b1d432b95"
                >
                    <AdvancedMarker position={fakeGeocodedLocation} />
                </Map>
            </div>
        </APIProvider>
    );
}
