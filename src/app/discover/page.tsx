
'use client';

import { MapView } from './map-view';
import TherapistCard from '@/components/therapist-card';
import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RequestTherapistForm } from '@/components/request-therapist-form';
import { Hand, List, Map as MapIcon, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Therapist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { listTherapists } from '@/lib/repos/therapists';
import { getTherapyCategories } from '@/lib/repos/categories';
import { LocationConsentDialog } from '@/components/location-consent-dialog';
import { getDistance } from 'geolib';
import { FilterBar } from '@/components/admin/FilterBar';

export default function DiscoverPage() {
  const [allTherapists, setAllTherapists] = useState<Therapist[]>([]);
  const [therapyCategories, setTherapyCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [filters, setFilters] = useState({
      specialty: [],
      availability: 'any',
      plan: 'any',
      radius: 15,
      sort: 'distance',
      gender: 'any',
      experience: 0,
      language: 'any',
      search: '',
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [therapistsData, categoriesData] = await Promise.all([
          listTherapists(),
          getTherapyCategories(),
        ]);
        setAllTherapists(therapistsData);
        setTherapyCategories(categoriesData);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: 'There was an error fetching therapist information. Please try again later.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  // Handle location consent
  useEffect(() => {
    if (loading || consentChecked) return;

    const locationConsent = localStorage.getItem('location-consent');
    if (locationConsent === 'granted') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
          setConsentChecked(true);
        },
        () => {
          // Fallback to default if there's an error getting position
          if (allTherapists.length > 0) setUserPosition({ lat: allTherapists[0].position.lat, lng: allTherapists[0].position.lng });
          setConsentChecked(true);
        }
      );
    } else if (locationConsent === 'denied') {
        if (allTherapists.length > 0) setUserPosition({ lat: 22.3072, lng: 73.1812 }); // Default to Vadodara
        setConsentChecked(true);
    }
    else {
      setShowConsent(true);
    }
  }, [loading, consentChecked, allTherapists]);

  const handleConsent = useCallback((consent: boolean) => {
    setShowConsent(false);
    if (consent) {
        localStorage.setItem('location-consent', 'granted');
        navigator.geolocation.getCurrentPosition((position) => {
            setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
            setConsentChecked(true);
        }, () => {
             if (allTherapists.length > 0) setUserPosition({ lat: allTherapists[0].position.lat, lng: allTherapists[0].position.lng });
             setConsentChecked(true);
        });
    } else {
        localStorage.setItem('location-consent', 'denied');
        if (allTherapists.length > 0) setUserPosition({ lat: 22.3072, lng: 73.1812 }); // Default to Vadodara
        setConsentChecked(true);
    }
  }, [allTherapists]);


  const filteredAndSortedTherapists = useMemo(() => {
    if (loading || !consentChecked || !userPosition) {
      return [];
    }
    
    // 1. Filter by user criteria
    let filtered = allTherapists.filter(therapist => {
        const specialtyMatch = filters.specialty.length === 0 || filters.specialty.some(s => therapist.serviceTypes.includes(s as never));
        const planMatch = filters.plan === 'any' || therapist.membershipPlan === filters.plan;
        const genderMatch = filters.gender === 'any'; // Mock gender filter
        const experienceMatch = therapist.experience >= filters.experience;
        const availabilityMatch = true;
        
        return specialtyMatch && planMatch && availabilityMatch && genderMatch && experienceMatch;
    });

    // 2. Calculate distance and filter by radius
    const therapistsWithDistance = filtered.map(therapist => {
        const distance = getDistance(
            { latitude: userPosition.lat, longitude: userPosition.lng },
            { latitude: therapist.position.lat, longitude: therapist.position.lng }
        );
        return { ...therapist, distance: distance / 1000 }; // convert to km
    }).filter(therapist => therapist.distance <= filters.radius);


    // 3. Apply sorting logic
    therapistsWithDistance.sort((a, b) => {
        // Premium members first
        if (a.membershipPlan === 'premium' && b.membershipPlan !== 'premium') return -1;
        if (a.membershipPlan !== 'premium' && b.membershipPlan === 'premium') return 1;

        if (filters.sort === 'distance') {
            if (a.distance < b.distance) return -1;
            if (a.distance > b.distance) return 1;
        } else if (filters.sort === 'rating') {
             if ((b.rating || 0) - (a.rating || 0) !== 0) return (b.rating || 0) - (a.rating || 0);
        } else if (filters.sort === 'experience') {
            if ((b.experience || 0) - (a.experience || 0) !== 0) return (b.experience || 0) - (a.experience || 0);
        }

        return (a.distance || 0) - (b.distance || 0); // Default tie-breaker is distance
    });
    
    return therapistsWithDistance;
  }, [allTherapists, userPosition, filters, loading, consentChecked]);


  return (
    <div className="container mx-auto py-8 md:py-12">
        <section className="mb-12 text-center p-8 rounded-lg bg-primary/5 border-2 border-primary/10">
            <h2 className="text-3xl font-bold font-headline">Overwhelmed by Choice?</h2>
            <p className="text-muted-foreground mt-2 mb-6 max-w-2xl mx-auto">Let our experts match you with the perfect therapist for your needs. It's fast, easy, and tailored to you.</p>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white hover:opacity-90 transition-opacity shadow-lg">
                        <Hand className="mr-2" />
                        Let Us Find a Therapist For You
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                    <DialogTitle>Request a Therapist</DialogTitle>
                    <DialogDescription>
                        Fill out this form and our team will find the best match for your needs.
                    </DialogDescription>
                    </DialogHeader>
                    <RequestTherapistForm />
                </DialogContent>
            </Dialog>
        </section>

        <section className="mb-12">
            <h1 className="text-xl font-bold font-headline mb-4">Find a Therapist</h1>
             <FilterBar 
                onFilterChange={setFilters}
                showDatePicker={false} // Availability is now a select
                showLocationFilters={true}
                showSearch={false} // Search is part of the bar now
                showTherapyFilters={true}
                showEcomFilters={false}
                showAdminUserFilters={false}
             />

            <Tabs defaultValue="list" className="w-full mt-6">
                <div className="flex justify-end mb-4">
                    <TabsList>
                        <TabsTrigger value="list"><List className="mr-2"/>List View</TabsTrigger>
                        <TabsTrigger value="map"><MapIcon className="mr-2"/>Map View</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="list">
                     {(loading || !consentChecked) ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                        </div>
                     ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSortedTherapists.map((therapist) => (
                                <TherapistCard key={therapist.id} therapist={therapist} />
                            ))}
                        </div>
                     )}
                </TabsContent>
                <TabsContent value="map">
                    <div className="h-[600px] w-full rounded-lg overflow-hidden border">
                        <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse" />}>
                           {(loading || !consentChecked) ? (
                             <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                             </div>
                           ) : (
                            <MapView therapists={filteredAndSortedTherapists} userPosition={userPosition} />
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
