'use client';

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Activity, Star, ArrowRight, UserPlus, List, Map as MapIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getDistance } from 'geolib';

import { MapView } from '@/app/discover/map-view';
import TherapistCard from '@/components/therapist-card';
import { FilterBar } from '@/components/admin/FilterBar';
import ProductCard from "@/components/product-card";
import { LocationConsentDialog } from '@/components/location-consent-dialog';
import type { Therapist } from '@/lib/types';

// Custom icons and subtexts mapping
const customTiles = [
  { match: "physiotherapy", subtext: "Pain, mobility & recovery", icon: "fa-solid fa-person-walking" },
  { match: "post-surgery", subtext: "Guided recovery support", icon: "fa-solid fa-bed-pulse" },
  { match: "neuro rehab", subtext: "Stroke, balance & nerve care", icon: "fa-solid fa-brain" },
  { match: "respiratory", subtext: "Breathing & lung support", icon: "fa-solid fa-lungs" },
  { match: "postpartum", subtext: "Mother & baby recovery care", icon: "fa-solid fa-baby" },
  { match: "elder care", subtext: "Senior care & assistance", icon: "fa-solid fa-wheelchair" },
  { match: "nursing care", subtext: "Home nursing support", icon: "fa-solid fa-user-nurse" },
  { match: "speech therapy", subtext: "Speech & communication care", icon: "fa-solid fa-comments" },
  { match: "occupational", subtext: "Workplace wellness services", icon: "fa-solid fa-briefcase-medical" }
];

function getTileData(categoryName: string) {
  const normalized = categoryName.toLowerCase();
  for (const custom of customTiles) {
    if (normalized.includes(custom.match)) {
      return { subtext: custom.subtext, icon: custom.icon };
    }
  }
  return { subtext: "Explore this service", icon: "fa-solid fa-stethoscope" };
}

export default function TherapyClientPage({ 
  initialCategories, 
  initialProducts, 
  initialTherapists 
}: { 
  initialCategories: any[], 
  initialProducts: any[], 
  initialTherapists: Therapist[] 
}) {
  const [selectedTherapy, setSelectedTherapy] = useState<string>('');
  
  // Location and filtering state
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [filters, setFilters] = useState({
    specialty: [] as string[],
    availability: 'any',
    plan: 'any',
    radius: 15,
    sort: 'distance',
    gender: 'any',
    experience_years: 0,
    language: 'any',
    search: '',
  });

  const therapistsSectionRef = useRef<HTMLDivElement>(null);

  // Sync selected therapy with filters
  useEffect(() => {
    if (selectedTherapy) {
      setFilters(prev => ({ ...prev, specialty: [selectedTherapy] }));
    }
  }, [selectedTherapy]);

  // Handle location consent
  useEffect(() => {
    if (consentChecked) return;

    const locationConsent = localStorage.getItem('location-consent');
    if (locationConsent === 'granted') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
          setConsentChecked(true);
        },
        () => {
          if (initialTherapists.length > 0) setUserPosition({ lat: initialTherapists[0].lat, lng: initialTherapists[0].lng });
          setConsentChecked(true);
        }
      );
    } else if (locationConsent === 'denied') {
        if (initialTherapists.length > 0) setUserPosition({ lat: 22.3072, lng: 73.1812 });
        setConsentChecked(true);
    } else {
      setShowConsent(true);
    }
  }, [consentChecked, initialTherapists]);

  const handleConsent = useCallback((consent: boolean) => {
    setShowConsent(false);
    if (consent) {
        localStorage.setItem('location-consent', 'granted');
        navigator.geolocation.getCurrentPosition((position) => {
            setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
            setConsentChecked(true);
        }, () => {
             if (initialTherapists.length > 0) setUserPosition({ lat: initialTherapists[0].lat, lng: initialTherapists[0].lng });
             setConsentChecked(true);
        });
    } else {
        localStorage.setItem('location-consent', 'denied');
        if (initialTherapists.length > 0) setUserPosition({ lat: 22.3072, lng: 73.1812 });
        setConsentChecked(true);
    }
  }, [initialTherapists]);

  const filteredAndSortedTherapists = useMemo(() => {
    if (!consentChecked || !userPosition) return [];
    
    let filtered = initialTherapists.filter(therapist => {
        const specialtyMatch = filters.specialty.length === 0 || filters.specialty.some(s => (therapist.serviceTypes || []).includes(s as never));
        const planMatch = filters.plan === 'any' || therapist.membershipPlan === filters.plan;
        const experienceMatch = (therapist.experience_years || 0) >= filters.experience_years;
        return specialtyMatch && planMatch && experienceMatch;
    });

    const therapistsWithDistance = filtered.map(therapist => {
        const distance = getDistance(
            { latitude: userPosition.lat, longitude: userPosition.lng },
            { latitude: therapist.lat || 0, longitude: therapist.lng || 0 }
        );
        return { ...therapist, distance: distance / 1000 };
    }).filter(therapist => therapist.distance <= filters.radius);

    therapistsWithDistance.sort((a, b) => {
        if (a.membershipPlan === 'premium' && b.membershipPlan !== 'premium') return -1;
        if (a.membershipPlan !== 'premium' && b.membershipPlan === 'premium') return 1;

        if (filters.sort === 'distance') {
            return (a.distance || 0) - (b.distance || 0);
        } else if (filters.sort === 'rating') {
             return (b.rating || 0) - (a.rating || 0);
        } else if (filters.sort === 'experience_years') {
            return (b.experience_years || 0) - (a.experience_years || 0);
        }
        return (a.distance || 0) - (b.distance || 0);
    });
    
    return therapistsWithDistance;
  }, [initialTherapists, userPosition, filters, consentChecked]);

  // Filter products based on selected therapy
  const relevantProducts = useMemo(() => {
    if (!selectedTherapy) return initialProducts.slice(0, 4);
    
    const filtered = initialProducts.filter(p => 
      p.categoryName?.toLowerCase() === selectedTherapy.toLowerCase() ||
      p.name?.toLowerCase().includes(selectedTherapy.toLowerCase())
    );
    
    return filtered.length > 0 ? filtered : initialProducts.slice(0, 4);
  }, [selectedTherapy, initialProducts]);

  const handleTileClick = (therapyName: string) => {
    setSelectedTherapy(therapyName);
    setTimeout(() => {
      therapistsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl mb-24">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-8 text-center">
          Expert healthcare, at your doorstep
        </h1>

        {/* 3x3 Service Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Select a Service</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {initialCategories.slice(0, 9).map((category: any) => {
              const serviceName = category.name;
              const { subtext, icon } = getTileData(serviceName);

              return (
                <button
                  key={category.id || serviceName}
                  onClick={() => handleTileClick(serviceName)}
                  className={`group flex flex-col items-center text-center gap-4 transition-all duration-300 p-6 rounded-xl border-2 ${
                    selectedTherapy === serviceName 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-gray-100 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-shadow shadow-sm bg-white border border-gray-100`}>
                    <i className={`${icon} text-3xl text-primary group-hover:scale-110 transition-transform`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors">
                      {serviceName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {subtext}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Find a Therapist Section */}
      <div className="bg-white py-16 border-t border-gray-100" ref={therapistsSectionRef}>
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold font-headline mb-8">
            {selectedTherapy ? `Therapists for ${selectedTherapy}` : 'Find a Therapist'}
          </h2>
          
          <FilterBar 
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
              if (newFilters.specialty.length === 1 && newFilters.specialty[0] !== selectedTherapy) {
                setSelectedTherapy(newFilters.specialty[0]);
              } else if (newFilters.specialty.length === 0 && selectedTherapy) {
                setSelectedTherapy('');
              }
            }}
            initialFilters={{ specialty: selectedTherapy ? [selectedTherapy] : [] }}
            showDatePicker={false}
            showLocationFilters={true}
            showSearch={false}
            showTherapyFilters={true}
            showEcomFilters={false}
            showAdminUserFilters={false}
          />

          <div className="mt-8">
            {!consentChecked ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
              </div>
            ) : filteredAndSortedTherapists.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedTherapists.map((therapist) => (
                  <TherapistCard key={therapist.id} therapist={therapist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No therapists found matching your criteria in this area.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Products Section */}
      {relevantProducts.length > 0 && (
        <div className="bg-gray-50 py-16 border-t border-gray-200">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedTherapy ? `Recommended Products for ${selectedTherapy}` : 'Health & Wellness Products'}
                </h2>
                <p className="text-gray-600">Professional-grade medical devices and supplies.</p>
              </div>
              <Link href="/shop" className="hidden sm:flex items-center text-primary font-semibold hover:underline">
                View all products <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relevantProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/shop" className="inline-flex items-center text-primary font-semibold hover:underline">
                View all products <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Location Consent */}
      <LocationConsentDialog open={showConsent} onConsent={handleConsent} />
    </div>
  );
}
