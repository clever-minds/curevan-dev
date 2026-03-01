'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import TherapistCard from '@/components/therapist-card';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/admin/FilterBar';
import { LocationConsentDialog } from '@/components/location-consent-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Therapist } from '@/lib/types';
import { listTherapistsByLocation } from '@/lib/repos/therapists';
import { getDistance } from 'geolib';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Map as MapIcon, Loader2 } from 'lucide-react';
import { MapView } from '@/app/discover/map-view';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 12;

export default function TherapistsPage() {
  const [allTherapists, setAllTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const [filters, setFilters] = useState({
    specialty: [],
    availability: 'any',
    plan: 'any',
    sort: 'distance',
    gender: 'any',
    experience: 0,
    language: 'any',
    search: '',
  });

  // -----------------------------
  // LOCATION CONSENT FLOW
  // -----------------------------
  useEffect(() => {
    const locationConsent = localStorage.getItem('location-consent');

    if (locationConsent === 'granted') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setConsentChecked(true);
        },
        () => {
          setUserPosition({ lat: 22.3072, lng: 73.1812 }); // Default fallback
          setConsentChecked(true);
        }
      );
    } else if (locationConsent === 'denied') {
      setUserPosition({ lat: 22.3072, lng: 73.1812 });
      setConsentChecked(true);
    } else {
      setShowConsent(true);
    }
  }, []);

  const handleConsent = useCallback((consent: boolean) => {
    setShowConsent(false);

    if (consent) {
      localStorage.setItem('location-consent', 'granted');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setConsentChecked(true);
        },
        () => {
          setUserPosition({ lat: 22.3072, lng: 73.1812 });
          setConsentChecked(true);
        }
      );
    } else {
      localStorage.setItem('location-consent', 'denied');
      setUserPosition({ lat: 22.3072, lng: 73.1812 });
      setConsentChecked(true);
    }
  }, []);

  // -----------------------------
  // FETCH THERAPISTS (Backend Radius Applied)
  // -----------------------------
  useEffect(() => {
    if (!userPosition) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const therapistsData = await listTherapistsByLocation(
          userPosition.lat,
          userPosition.lng
        );
        console.log("therapistsData",therapistsData);

        // Null-safe fix
        setAllTherapists(therapistsData ?? []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: 'There was an error fetching therapist information.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userPosition, toast]);

  // -----------------------------
  // FILTER + SORT (NO RADIUS FILTER)
  // -----------------------------
  const filteredAndSortedTherapists = useMemo(() => {
    
    if (loading || !consentChecked || !userPosition) {
      return [];
    }
   
    let filtered = allTherapists.filter((therapist) => {
      const specialtyMatch =
        filters.specialty.length === 0 ||
        filters.specialty.some((s) =>
          therapist.serviceTypes.includes(s as never)
        );

      const planMatch =
        filters.plan === 'any' || therapist.membershipPlan === filters.plan;

      const experienceMatch =
        therapist.experience >= filters.experience;
      const searchMatch =
        !filters.search ||
        therapist.name.toLowerCase().includes(filters.search.toLowerCase());

      return specialtyMatch && planMatch  && searchMatch;
    });

    const therapistsWithDistance = filtered.map((therapist) => {
      const distance = getDistance(
        { latitude: userPosition.lat, longitude: userPosition.lng },
        {
          latitude: therapist.position.lat,
          longitude: therapist.position.lng,
        }
      );
      
      return { ...therapist, distance: distance / 1000 };
    });

    therapistsWithDistance.sort((a, b) => {
      if (a.membershipPlan === 'premium' && b.membershipPlan !== 'premium')
        return -1;
      if (a.membershipPlan !== 'premium' && b.membershipPlan === 'premium')
        return 1;

      if (filters.sort === 'distance')
        return (a.distance || 0) - (b.distance || 0);

      if (filters.sort === 'rating')
        return (b.rating || 0) - (a.rating || 0);

      if (filters.sort === 'experience')
        return (b.experience || 0) - (a.experience || 0);

      return (a.distance || 0) - (b.distance || 0);
    });

    return therapistsWithDistance;
  }, [allTherapists, userPosition, filters, loading, consentChecked]);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const currentTherapists = filteredAndSortedTherapists.slice(
    0,
    visibleCount
  );
console.log("currentTherapists",currentTherapists);
  return (
    <div className="container mx-auto py-12 md:py-20">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl">
          Meet Our Therapists
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Find the right expert to guide you on your wellness journey.
        </p>
      </section>

      <section className="mt-12">
        <FilterBar
          onFilterChange={setFilters}
          showDatePicker={false}
          showLocationFilters={true}
          showSearch={true}
          showTherapyFilters={true}
        />

        <Tabs defaultValue="list" className="w-full mt-6">
          <div className="flex justify-end mb-4">
            <TabsList>
              <TabsTrigger value="list">
                <List className="mr-2" />
                List View
              </TabsTrigger>
              <TabsTrigger value="map">
                <MapIcon className="mr-2" />
                Map View
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {currentTherapists.map((therapist, index) => (
                    <div
                      key={therapist.id}
                      className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TherapistCard therapist={therapist} />
                    </div>
                  ))}
                </div>

                {filteredAndSortedTherapists.length === 0 && (
                  <div className="text-center py-16">
                    <h3 className="text-2xl font-semibold">
                      No Therapists Found
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Try adjusting your filters.
                    </p>
                  </div>
                )}

                {visibleCount < filteredAndSortedTherapists.length && (
                  <div className="mt-12 text-center">
                    <Button onClick={handleShowMore} size="lg">
                      Show More Therapists
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="map">
            <div className="h-[600px] w-full rounded-lg overflow-hidden border">
              <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse" />}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <MapView
                    therapists={filteredAndSortedTherapists}
                    userPosition={userPosition}
                  />
                )}
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <LocationConsentDialog open={showConsent} onConsent={handleConsent} />
    </div>
  );
}