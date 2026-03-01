'use client';

import { useEffect, useState } from 'react';

export default function GetLatLng() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocation({ lat, lng });

        console.log('Latitude:', lat);
        console.log('Longitude:', lng);
      },
      (error) => {
        console.log('Error:', error.message);
      }
    );
  }, []);

  if (!location) return <p>Getting location...</p>;

  return (
    <div>
      <p>Latitude: {location.lat}</p>
      <p>Longitude: {location.lng}</p>
    </div>
  );
}