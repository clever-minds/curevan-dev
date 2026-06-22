        'use client';

        import Link from 'next/link';
        import Image from 'next/image';
        import type { Therapist } from '@/lib/types';
        import { Card, CardContent } from '@/components/ui/card';
        import { Button } from '@/components/ui/button';
        import { Star, MessageSquare, MapPin, ShieldCheck, BriefcaseMedical, CheckCircle2 } from 'lucide-react';
        import { cn } from '@/lib/utils';
        import { Badge } from './ui/badge';
        import { imageUrl } from '@/lib/image';

        export default function TherapistCard({ therapist, isMapPopup = false }: { therapist: Therapist & { distance?: number }, isMapPopup?: boolean }) {
        const CardComponent = isMapPopup ? 'div' : Card;
        const isPremium = therapist.membershipPlan === 'premium';
        return (
            <CardComponent className={cn(
                'group flex flex-col overflow-hidden h-full',
                !isMapPopup && 'relative border-b sm:border border-gray-200 bg-white sm:rounded-2xl',
                isPremium && !isMapPopup ? 'border-primary/30 bg-primary/5' : ''
            )}>
            <CardContent className={cn('flex flex-col h-full', isMapPopup ? 'p-0' : 'p-6')}>
                <div className="flex justify-between gap-6 h-full">
                    {/* Left: Details Area */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        {isPremium && (
                           <div className="inline-flex self-start items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-sm mb-2">
                               <ShieldCheck className="w-3 h-3"/> PRO VERIFIED
                           </div>
                        )}
                        <h3 className="font-bold text-xl md:text-2xl text-gray-900 leading-tight">
                            {therapist.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-600">
                            <Star className="w-4 h-4 fill-green-700 text-green-700" />
                            <span className="font-bold text-gray-900">{therapist.rating || '4.5'}</span>
                            <span className="text-gray-500">({therapist.reviews || '85K'} reviews)</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                            <span className="font-bold text-gray-900">₹{therapist.hourlyRate || (therapist as any).hourly_rate || 500}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-600 text-sm font-medium">{therapist.experience_years} yrs exp</span>
                        </div>

                        <div className="w-full border-t border-dashed border-gray-300 my-4"></div>

                        <ul className="text-sm text-gray-600 space-y-2 flex-1">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></span>
                                <span><span className="font-semibold text-gray-700">Specialty:</span> {therapist.serviceTypes && therapist.serviceTypes.length > 0 ? therapist.serviceTypes.join(', ') : therapist.specialty}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></span>
                                <span>{therapist.city}, {therapist.state} {therapist.distance != null && `• ${Number(therapist.distance).toFixed(1)} km away`}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Right: Image Area & Book Button */}
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 mt-2">
                        <Image
                             src={therapist.image ? imageUrl(therapist.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=e0f2fe&color=0284c7&size=256&font-size=0.33`}
                            alt={therapist.name}
                            fill
                            className="rounded-xl object-cover bg-gray-100 shadow-sm"
                            data-ai-hint="therapist portrait"
                        />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full flex justify-center">
                            <Button asChild className="font-bold px-4 shadow-md border border-gray-100 text-primary bg-white hover:bg-gray-50 rounded-lg h-10 w-36 uppercase tracking-wide text-xs sm:text-sm">
                                <Link href={`/therapists/${therapist.name.toLowerCase().replace(/ /g, '-')}`}>
                                    View Profile
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Extra Bottom Padding for floating button */}
                <div className="pb-2"></div>
            </CardContent>
            </CardComponent>
        );
        }
