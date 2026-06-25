'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import TherapistCard from '@/components/therapist-card';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/admin/FilterBar';
import { LocationConsentDialog } from '@/components/location-consent-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Therapist, Product, ProductCategory } from '@/lib/types';
import { listTherapistsByLocation, listTherapists } from '@/lib/repos/therapists';
import { fetchPublicProducts, fetchPublicProductCategories } from '@/lib/repos/products';
import { getTherapyCategoriesWithIds } from '@/lib/repos/categories';
import ProductCard from '@/components/product-card';
import { getDistance } from 'geolib';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Map as MapIcon, Loader2, MapPin, ChevronRight, SlidersHorizontal, SearchX } from 'lucide-react';
import { MapView } from '@/app/discover/map-view';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const SPECIALTIES = [
  "Physiotherapy",
  "Nursing Care",
  "Speech Therapy",
  "Occupational Therapy",
  "Behavioral Therapy",
  "Special Education",
];

const PAGE_SIZE = 12;

export default function TherapistCategoryPage({ params }: { params: { service: string | string[] } }) {
  // Safe fallback since React.use is not available in React 18
  const rawService = Array.isArray(params?.service) ? params.service.join('/') : params?.service || '';
  const serviceName = decodeURIComponent(rawService);
  const [allTherapists, setAllTherapists] = useState<Therapist[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [serviceTypes, setServiceTypes] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showMap, setShowMap] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsData, categoriesData, serviceTypesData] = await Promise.all([
          fetchPublicProducts(),
          fetchPublicProductCategories(),
          getTherapyCategoriesWithIds()
        ]);
        setProducts(productsData || []);
        setProductCategories(categoriesData || []);
        setServiceTypes(serviceTypesData || []);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };
    fetchProducts();
  }, []);

  const [filters, setFilters] = useState({
    specialty: [serviceName],
    availability: 'any',
    plan: 'any',
    sort: 'distance',
    gender: 'any',
    experience_years: 0,
    language: 'any',
    search: '',
    location: '',
    lat: null as number | null,
    lng: null as number | null,
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

        let therapistsData;
        if (filters.lat && filters.lng) {
          // User searched for a specific location using Google Places
          therapistsData = await listTherapistsByLocation(
            filters.lat,
            filters.lng
          );
        } else if (filters.search) {
          // User is searching by name only, fetch all to search globally
          therapistsData = await listTherapists();
        } else {
          // Default: nearby to user's GPS
          therapistsData = await listTherapistsByLocation(
            userPosition.lat,
            userPosition.lng
          );
        }
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
  }, [userPosition, toast, filters.lat, filters.lng, filters.search]);

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
        therapist.experience_years >= filters.experience_years;
      const searchMatch =
        !filters.search ||
        therapist.name.toLowerCase().includes(filters.search.toLowerCase());

      // If we used Google Places to fetch by location, the backend already 
      // filtered by radius, so we don't strictly need this local locationMatch.
      // But we'll keep it for cases where someone types text without selecting from Google.
      const locationMatch =
        (!filters.location || filters.lat) ||
        (therapist.city && therapist.city.toLowerCase().includes(filters.location.toLowerCase())) ||
        (therapist.state && therapist.state.toLowerCase().includes(filters.location.toLowerCase())) ||
        (therapist.pin && therapist.pin.toString().includes(filters.location));

      return specialtyMatch && planMatch  && searchMatch && locationMatch;
    });

    const refLat = filters.lat || (userPosition ? userPosition.lat : 0);
    const refLng = filters.lng || (userPosition ? userPosition.lng : 0);

    const therapistsWithDistance = filtered.map((therapist) => {
      // Only calculate distance if we have a valid reference point
      if (!refLat || !refLng) {
        return { ...therapist, distance: 0 };
      }

      const distance = getDistance(
        { latitude: refLat, longitude: refLng },
        {
          latitude: therapist.lat,
          longitude: therapist.lng,
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

      if (filters.sort === 'experience_years')
        return (b.experience_years || 0) - (a.experience_years || 0);

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

  const currentTherapists = filteredAndSortedTherapists.slice(0, visibleCount);

  const recommendedProductsData = useMemo(() => {
    if (!products.length || !productCategories.length || !serviceTypes.length) return { products: [], categoryName: '', isFallback: true };

    const searchStr = serviceName?.toLowerCase() || '';
    const currentServiceType = serviceTypes.find(st => st.name?.toLowerCase() === searchStr);
    
    if (currentServiceType) {
       const recommended = products.filter(p => p.is_recommended && p.service_type_id === currentServiceType.id);
       if (recommended.length > 0) {
           return { products: recommended.slice(0, 4), categoryName: currentServiceType.name, isFallback: false };
       }
    }

    // Try finding by category mapping if no recommended products exist for this exact service type
    const matchingCategories = productCategories.filter(cat => 
       cat.name?.toLowerCase().includes(searchStr) || 
       (cat.name && searchStr.includes(cat.name.toLowerCase()))
    );

    let filtered: Product[] = [];
    let matchedCategoryName = '';

    if (matchingCategories.length > 0) {
       const categoryIds = matchingCategories.map(c => c.id);
       filtered = products.filter(p => categoryIds.includes(p.categoryId));
       matchedCategoryName = matchingCategories[0].name;
    }

    if (filtered.length > 0) {
      return { products: filtered.slice(0, 4), categoryName: matchedCategoryName, isFallback: true };
    }

    // Fallback: find the actual 'General' category from the database
    const generalCategory = productCategories.find(c => c.name?.toLowerCase().includes('general'));
    if (generalCategory) {
      const generalProducts = products.filter(p => p.categoryId === generalCategory.id);
      if (generalProducts.length > 0) {
        return { products: generalProducts.slice(0, 4), categoryName: generalCategory.name, isFallback: true };
      }
    }

    // Ultimate fallback if no 'General' category exists or it has no products
    return { products: [], categoryName: 'General', isFallback: true };
  }, [products, productCategories, serviceTypes, serviceName]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Ultra Premium Hero Section */}
      <div className="relative bg-[#0A192F] overflow-hidden pt-16 pb-32 border-b border-white/10">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat mix-blend-luminosity"
          style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1661779581951-eb3a2fe942bb?q=80&w=1170&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/80 to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0A192F]/90 via-transparent to-[#0A192F]/90" />

        {/* Dynamic Glowing Background Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] opacity-70 animate-pulse z-0" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-[120px] opacity-50 z-0" />

        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white font-semibold text-sm mb-8 shadow-2xl border border-white/20 hover:bg-white/20 transition-all cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Top-Rated Professionals Verified
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white capitalize leading-[1.1] drop-shadow-lg">
              Expert <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{serviceName}s</span> <br className="hidden md:block"/> at Your Doorstep
            </h1>
            
            <p className="mt-8 text-lg md:text-2xl text-slate-300 flex items-center justify-center gap-3 font-medium max-w-2xl">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <MapPin className="w-5 h-5 text-cyan-400" />
              </span>
              {userPosition && consentChecked 
                ? `Showing the best ${serviceName.toLowerCase()}s near you` 
                : `Allow location to find elite ${serviceName.toLowerCase()}s nearby`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area - Overlapping the Hero */}
      <div className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar (Desktop Filters) */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5"/> Filters
              </h2>
              <FilterBar
                initialFilters={filters}
                onFilterChange={setFilters}
                showDatePicker={false}
                showLocationFilters={true}
                showSearch={true}
                showTherapyFilters={true}
                orientation="vertical"
              />
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Bar Area (handled by FilterBar internally, just rendering it here) */}
            <div className="lg:hidden mb-6">
                <FilterBar
                    initialFilters={filters}
                    onFilterChange={setFilters}
                    showDatePicker={false}
                    showLocationFilters={true}
                    showSearch={true}
                    showTherapyFilters={true}
                />
            </div>

            {showMap ? (
                <div className="h-[calc(100vh-200px)] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
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
            ) : (
                <>
                  {loading ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-6 max-w-4xl">
                        {currentTherapists.map((therapist, index) => (
                          <div
                            key={therapist.id}
                            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TherapistCard therapist={therapist} />
                          </div>
                        ))}
                      </div>

                      {filteredAndSortedTherapists.length === 0 && (
                        <div className="flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-gray-100 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                            <SearchX className="w-10 h-10 text-primary/40" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">No {serviceName}s Found</h3>
                          <p className="text-gray-500 max-w-sm mb-8 text-lg">We couldn't find any professionals matching your criteria in this area. Try adjusting your filters.</p>
                          <Button 
                            onClick={() => setFilters({
                              specialty: [serviceName],
                              availability: 'any',
                              plan: 'any',
                              sort: 'distance',
                              gender: 'any',
                              experience_years: 0,
                              language: 'any',
                              search: '',
                              location: '',
                              lat: null,
                              lng: null,
                            })}
                            className="rounded-full px-8 hover:scale-105 transition-transform"
                            size="lg"
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      )}

                      {visibleCount < filteredAndSortedTherapists.length && (
                        <div className="mt-12 text-center">
                          <Button onClick={handleShowMore} variant="outline" size="lg" className="rounded-full px-8 bg-white hover:bg-gray-50">
                            View More Therapists
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Products Section */}
      {recommendedProductsData.products.length > 0 && (
        <div className="bg-white border-t border-gray-100 py-16">
          <div className="container mx-auto px-4 md:px-0">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold font-headline mb-2">Recommended Products</h2>
                <p className="text-muted-foreground text-lg">
                  Top medical devices and wellness products for {serviceName}.
                </p>
              </div>
              <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold w-fit border border-primary/20">
                Filtered by: {recommendedProductsData.categoryName} {recommendedProductsData.isFallback ? '(Fallback)' : ''}
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProductsData.products.map(product => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Map Toggle Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <Button 
            size="lg" 
            className="rounded-full shadow-lg font-bold px-6 bg-gray-900 hover:bg-gray-800 text-white border border-gray-700"
            onClick={() => setShowMap(!showMap)}
        >
            {showMap ? (
                <><List className="w-5 h-5 mr-2" /> Show List</>
            ) : (
                <><MapIcon className="w-5 h-5 mr-2" /> Map View</>
            )}
        </Button>
      </div>

      <LocationConsentDialog open={showConsent} onConsent={handleConsent} />
    </div>
  );
}