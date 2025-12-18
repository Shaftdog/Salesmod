"use client"

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

type OrderMapProps = {
    address: string;
    lat?: number;
    lng?: number;
};

// Default to Orlando, FL area if no coordinates provided
const DEFAULT_LOCATION = {
    lat: 28.5383,
    lng: -81.3792,
};

// Map ID from Google Cloud Console (required for AdvancedMarker)
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

export function OrderMap({ address, lat, lng }: OrderMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center min-h-[300px] h-full bg-muted rounded-lg border border-dashed border-muted-foreground/25">
                <div className="text-center">
                    <p className="text-muted-foreground text-sm">Map unavailable</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Google Maps API key not configured</p>
                </div>
            </div>
        );
    }

    const center = lat && lng ? { lat, lng } : DEFAULT_LOCATION;

    return (
        <APIProvider apiKey={apiKey}>
            <div className="min-h-[300px] h-full w-full rounded-lg overflow-hidden">
                <Map
                    defaultCenter={center}
                    defaultZoom={14}
                    gestureHandling="cooperative"
                    disableDefaultUI={false}
                    mapId={MAP_ID}
                    style={{ width: '100%', height: '100%', minHeight: '300px' }}
                >
                    <AdvancedMarker position={center}>
                        <Pin background="#3b82f6" glyphColor="#fff" borderColor="#1d4ed8" />
                    </AdvancedMarker>
                </Map>
            </div>
        </APIProvider>
    );
}
