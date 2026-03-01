'use client';

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import type { Therapist } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck } from 'lucide-react';
import TherapistCard from '@/components/therapist-card';

export function MapView({
  therapists,
  userPosition,
}: {
  therapists: (Therapist & { distance?: number })[];
  userPosition: { lat: number; lng: number } | null;
}) {
  const apiKey = 'AIzaSyDGxg9Uw6sQXWDVoEAmirxdVF5neAICKJM';
  const [selectedTherapistId, setSelectedTherapistId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (userPosition) setLoading(false);
  }, [userPosition]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <Alert variant="destructive">
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Google Maps API Key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2">Loading Map...</p>
      </div>
    );
  }

  // Selected therapist object
  const selectedTherapist = selectedTherapistId
    ? therapists.find((t) => t.id === selectedTherapistId)
    : null;

  const infoWindowPosition =
    selectedTherapist &&
    !isNaN(Number(selectedTherapist.lat)) &&
    !isNaN(Number(selectedTherapist.lng))
      ? { lat: Number(selectedTherapist.lat), lng: Number(selectedTherapist.lng) }
      : null;

  return (
    <APIProvider apiKey={apiKey} onLoad={() => console.log('Maps API loaded.')} libraries={['maps', 'marker', 'places']}>
      <Map
        center={userPosition || { lat: 22.3072, lng: 73.1812 }}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="curevan-map"
      >
        {/* Therapist Markers */}
        {therapists.map((therapist) => {
        const latNum = Number(therapist.lat) + Math.random() * 0.0001;
        const lngNum = Number(therapist.lng) + Math.random() * 0.0001;
          if (isNaN(latNum) || isNaN(lngNum)) return null;
          return (
            <AdvancedMarker
              key={therapist.id}
              position={{ lat: latNum, lng: lngNum }}
              onClick={() => setSelectedTherapistId(therapist.id)}
            >
              {therapist.membershipPlan === 'premium' ? (
                <Pin background="hsl(var(--primary))" borderColor="white" glyphColor="white">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </Pin>
              ) : (
                <Pin background="hsl(var(--muted-foreground))" borderColor="white" glyphColor="white" />
              )}
            </AdvancedMarker>
          );
        })}

        {/* User Position Marker */}
        {userPosition && (
          <AdvancedMarker position={userPosition} zIndex={10}>
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" title="Your Location" />
          </AdvancedMarker>
        )}

        {/* InfoWindow outside markers */}
        {selectedTherapist && infoWindowPosition && (
          <InfoWindow
            key={`info-${selectedTherapist.id}`}
            position={infoWindowPosition}
            onCloseClick={() => setSelectedTherapistId(null)}
            pixelOffset={[0, -40]}
          >
            <div className="p-1 w-80">
              <TherapistCard therapist={selectedTherapist} isMapPopup />
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}