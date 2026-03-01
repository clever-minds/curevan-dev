'use client';

import { useRef, useEffect, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';

const libraries: ("places")[] = ["places"];

interface Props {
  value?: string;
  onAddressSelect: (data: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pin: string;
    lat: number;
    lng: number;
    fullAddress: string;
  }) => void;
}

export default function GooglePlacesInput({
  value = '',
  onAddressSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [inputValue, setInputValue] = useState(value);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyDGxg9Uw6sQXWDVoEAmirxdVF5neAICKJM",
    libraries,
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current =
      new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' },
      });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place || !place.address_components || !place.geometry) return;

      let streetNumber = '';
      let route = '';
      let sublocality = '';
      let neighborhood = '';
      let premise = '';
      let city = '';
      let state = '';
      let pin = '';

      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes('street_number'))
          streetNumber = component.long_name;
        if (types.includes('route')) route = component.long_name;
        if (
          types.includes('sublocality') ||
          types.includes('sublocality_level_1')
        )
          sublocality = component.long_name;
        if (types.includes('neighborhood'))
          neighborhood = component.long_name;
        if (types.includes('premise')) premise = component.long_name;
        if (types.includes('locality')) city = component.long_name;
        if (types.includes('administrative_area_level_1'))
          state = component.long_name;
        if (types.includes('postal_code')) pin = component.long_name;
      });

      const line1 = `${streetNumber} ${route}`.trim();
      const line2 = premise || sublocality || neighborhood || '';

      // ✅ COMPANY NAME + ADDRESS
      const companyName = place.name || '';
      const fullAddress = [
        companyName,
        place.formatted_address,
      ]
        .filter(Boolean)
        .join(', ');

      const lat = place.geometry.location?.lat() || 0;
      const lng = place.geometry.location?.lng() || 0;

      setInputValue(fullAddress);

      onAddressSelect({
        line1,
        line2,
        city,
        state,
        pin,
        lat,
        lng,
        fullAddress,
      });
    });
  }, [isLoaded, onAddressSelect]);

  if (!isLoaded) {
    return <Input placeholder="Loading..." disabled />;
  }

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Search your address"
    />
  );
}