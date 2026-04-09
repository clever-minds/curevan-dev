'use client'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CalendarCheck, Users, HeartPulse, ArrowRight, Share2, CheckCircle, UserPlus, BriefcaseMedical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/product-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Star } from 'lucide-react';
import { useEffect,useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import AnimatedWave from '@/components/animated-wave';
import TherapistCard from '@/components/therapist-card';
import type { Product, Therapist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { listTherapists,listTherapistsByLocation } from '@/lib/repos/therapists';
import { fetchPublicProducts } from '@/lib/repos/products';
import { ImpactStats } from '@/components/impact-stats';
import  GetLatLng  from '@/lib/api/getCurrentLocation'

export const dynamic = 'force-dynamic';
const faqs = [
  {
    question: "What is Curevan?",
    answer: "Curevan is a healthcare platform that offers professional therapy services, such as physiotherapy, directly to you at your home. We also provide a range of quality wellness products through our online shop."
  },
  {
    question: "How do I book a therapy session?",
    answer: "You can book a session by navigating to our 'Therapists' page, selecting a qualified therapist, and choosing an available time slot from their calendar. Alternatively, you can use our 'Let Us Find a Therapist For You' feature on the discover page, and our team will match you with the best professional for your needs."
  },
  {
    question: "Are your therapists qualified?",
    answer: "Yes, all therapists on the Curevan platform are licensed, vetted, and experienced professionals in their respective fields. We verify their credentials to ensure you receive the highest standard of care."
  },
    {
    question: "Can I use a therapist's referral code for booking a session?",
    answer: "No, referral codes are exclusively for getting discounts on products in our e-commerce shop. They do not apply to service bookings like therapy sessions."
  },
  {
    question: "What is a Patient Care Report (PCR)?",
    answer: "A Patient Care Report (PCR) is a secure digital document created by your therapist after each session. It contains important details about your assessment, the treatment provided, and the future plan of care. It helps ensure continuity and track your progress effectively."
  },
  {
    question: "What if I need to cancel or reschedule my appointment?",
    answer: "You can cancel or reschedule your appointment up to 4 hours before the scheduled time without any penalty. Cancellations made within 4 hours of the appointment may not be refundable. Please refer to our Refund & Cancellation Policy for more details."
  },
  {
    question: "Is my personal and medical information secure?",
    answer: "Absolutely. We prioritize your privacy and use industry-standard encryption and security measures to protect your data. Please review our Privacy Policy for detailed information on how we handle your information."
  }
];

const plans = [
    { feature: 'Joining Fee', free: '₹0 (No cost to join)', premium: '₹0 (No upfront fee)' },
    { feature: 'Earnings', free: '100% of what your patient pays goes directly to you', premium: <strong>90% (10% platform fee)</strong> },
    { feature: 'Patient Access', free: 'Standard patient matching', premium: <strong>Priority matching – you’ll be recommended first to new patients</strong> },
    { feature: 'Visibility', free: 'Listed on Curevan platform', premium: <strong>Highlighted as a Premium Therapist in search & listings</strong> },
    { feature: 'Flexibility', free: 'Continue your clinic or job without any changes', premium: <strong>Option to build full-time practice with Curevan support</strong> },
];


export default  function HomePage() {
  
      const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // 1️⃣ Get Current Location
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Geolocation requires a secure origin (https or localhost)
    const isSecureOrigin = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isSecureOrigin) {
      console.warn('Geolocation requires a secure origin (HTTPS or localhost). Current origin:', window.location.origin);
      // Fallback location (e.g., Vadodara)
      setLat(22.3072);
      setLng(73.1812);
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        console.log('console Lat:', userLat);
        console.log('console Lng:', userLng);

        setLat(userLat);
        setLng(userLng);
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        // Fallback on error
        setLat(22.3072);
        setLng(73.1812);
      }
    );
  }, []);

  // 2️⃣ Fetch Data when lat/lng available
  useEffect(() => {
    if (lat === null || lng === null) return

    const fetchData = async () => {
      const therapistData = await listTherapistsByLocation(lat, lng)
      console.log("therapistData",therapistData);

      setTherapists(therapistData || [])
      const productData = await fetchPublicProducts()
      setProducts(productData || [])
    }

    fetchData()
  }, [lat, lng])

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="w-full h-[calc(100vh-var(--header-height))] max-h-[600px] bg-card relative overflow-hidden flex items-center justify-center">
        <AnimatedWave />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline mb-4 text-white leading-tight">
            Quality Healthcare, Delivered to Your Doorstep
          </h1>
          <p className="max-w-2xl mx-auto text-white/80 md:text-xl mb-8">
            Curevan offers professional therapy services and quality wellness products delivered right to your door. <span className="font-bold text-white">Cure. Anywhere.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/discover">Book a Session</Link>
            </Button>
             <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/ecommerce">Shop Products</Link>
            </Button>
          </div>
        </div>
      </section>
      

      {/* How It Works Section */}
       <section id="how-it-works" className="w-full py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                        How Curevan Works
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground mt-8">Get professional healthcare delivered to your home in three simple steps.</p>
                </div>
                <div className="grid gap-6 md:gap-8 md:grid-cols-3">
                    <div className="group text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0 bg-gradient-to-b from-primary/5 to-transparent transition-all duration-500 group-hover:h-full z-0"></div>
                        <div className="relative z-10">
                            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/10 rounded-full transition-transform duration-300 group-hover:scale-110"></div>
                                <div className="absolute top-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-md">1</div>
                                <CalendarCheck className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold font-headline md:text-2xl mb-2">Book Your Session</h3>
                            <p className="text-muted-foreground">Select your therapy, choose a time, and <span className="font-semibold text-primary">book instantly</span> through our secure platform.</p>
                        </div>
                    </div>
                    <div className="group text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0 bg-gradient-to-b from-primary/5 to-transparent transition-all duration-500 group-hover:h-full z-0"></div>
                        <div className="relative z-10">
                            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/10 rounded-full transition-transform duration-300 group-hover:scale-110"></div>
                                <div className="absolute top-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-md">2</div>
                                <Users className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold font-headline md:text-2xl mb-2">Get Matched Instantly</h3>
                            <p className="text-muted-foreground">Our system finds the <span className="font-semibold text-primary">best certified therapist</span> for your specific needs.</p>
                        </div>
                    </div>
                    <div className="group text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0 bg-gradient-to-b from-primary/5 to-transparent transition-all duration-500 group-hover:h-full z-0"></div>
                        <div className="relative z-10">
                            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/10 rounded-full transition-transform duration-300 group-hover:scale-110"></div>
                                <div className="absolute top-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-md">3</div>
                                <HeartPulse className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold font-headline md:text-2xl mb-2">Receive Care at Home</h3>
                            <p className="text-muted-foreground">Your therapist arrives with <span className="font-semibold text-primary">all necessary equipment</span> for your session.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

      {/* Meet Our Experts Section */}
       <section id="experts" className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
             <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                Meet Our Experts
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mt-8">Licensed and compassionate professionals ready to help you.</p>
                 <Button asChild variant="ghost" size="lg" className="mt-6 text-primary">
                    <Link href="/therapists">
                        View All Therapists
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            className="w-full"
            >
            <CarouselContent>
                {therapists.map((therapist) => (
                <CarouselItem key={therapist.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                    <TherapistCard therapist={therapist} />
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
            </Carousel>
        </div>
        </section>

      {/* Join Our Team Section */}
      <section id="join-us" className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 text-center">
              <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                        Join Our Growing Network
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                    </h2>
                    <p className="text-lg text-muted-foreground mt-8 mb-8">
                        Are you a physiotherapist, nurse, or healthcare professional? With Curevan, you can earn extra income without affecting your clinic time or job. Prefer full-time? We’ll find patients for you—so you can focus only on care.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg">
                            <Link href="/auth/therapist-signup">
                                <UserPlus className="mr-2"/>
                                Register as a Therapist
                            </Link>
                        </Button>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Join 500+ healthcare professionals on our platform.</p>
              </div>
          </div>
      </section>
      
      {/* Membership Plans Section */}
      <section id="pricing" className="w-full py-16 md:py-24 bg-muted/30">
           <div className="container mx-auto px-4 md:px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                      Flexible Plans for Every Therapist
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground mt-8">Whether you're looking to supplement your income or build a full-time practice, we have a plan that fits your goals.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch max-w-4xl mx-auto">
                  {/* Free Plan Card */}
                  <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                      <CardHeader>
                          <CardTitle className="text-2xl font-headline">Forever Free</CardTitle>
                          <CardDescription>Perfect for getting started and earning extra on the side.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4">
                           <p className="text-4xl font-bold">₹0 <span className="text-lg font-normal text-muted-foreground">/ month</span></p>
                           <ul className="space-y-3">
                              {plans.map(p => (
                                  <li key={p.feature} className="flex items-start gap-3">
                                      <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                      <div><span className="font-semibold">{p.feature}:</span> {p.free}</div>
                                  </li>
                              ))}
                          </ul>
                      </CardContent>
                      <CardFooter>
                          <Button asChild className="w-full" variant="outline">
                              <Link href={'/auth/therapist-signup'}>Start with Free Plan</Link>
                          </Button>
                      </CardFooter>
                  </Card>

                  {/* Premium Plan Card */}
                   <Card className="flex flex-col border-2 border-primary shadow-lg relative bg-background transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                      <CardHeader>
                          <CardTitle className="text-2xl font-headline text-primary">Premium Member</CardTitle>
                          <CardDescription>Maximize your earnings and visibility to build a full-time practice.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4">
                           <p className="text-4xl font-bold">10% <span className="text-lg font-normal text-muted-foreground">Platform Fee</span></p>
                           <ul className="space-y-3">
                              {plans.map(p => (
                                  <li key={p.feature} className="flex items-start gap-3">
                                      <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                      <div><span className="font-semibold">{p.feature}:</span> {p.premium}</div>
                                  </li>
                              ))}
                          </ul>
                      </CardContent>
                      <CardFooter>
                           <Button asChild className="w-full">
                              <Link href={'/auth/therapist-signup'}>Upgrade to Premium</Link>
                          </Button>
                      </CardFooter>
                  </Card>
              </div>
          </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                    Wellness Products
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground mt-8">Professional equipment for effective, lasting recovery at home.</p>
                <Button asChild size="lg" className="mt-6">
                    <Link href="/ecommerce">
                        Shop All Products
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
             {products.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Impact Stats Section */}
      <ImpactStats />

      {/* FAQ Section */}
      <section id="faq" className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
           <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                Frequently Asked Questions
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mt-8">Find answers to common questions about our services and platform.</p>
            </div>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-semibold text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
