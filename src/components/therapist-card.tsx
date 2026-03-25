
        'use client';

        import Link from 'next/link';
        import Image from 'next/image';
        import type { Therapist } from '@/lib/types';
        import { Card, CardContent } from '@/components/ui/card';
        import { Button } from '@/components/ui/button';
        import { Star, MessageSquare, MapPin, ShieldCheck, BriefcaseMedical } from 'lucide-react';
        import { cn } from '@/lib/utils';
        import { Badge } from './ui/badge';
        import { imageUrl } from '@/lib/image';
         export default function TherapistCard({ therapist, isMapPopup = false }: { therapist: Therapist & { distance?: number }, isMapPopup?: boolean }) {
        const CardComponent = isMapPopup ? 'div' : Card;
        const isPremium = therapist.membershipPlan === 'premium';
        return (
            <CardComponent className={cn(
                'group flex flex-col h-full',
                !isMapPopup && 'hover:shadow-lg transition-shadow relative border-2',
                isPremium && !isMapPopup ? 'border-primary/50' : 'border-border'
            )}>
            {isPremium && !isMapPopup && (
                <Badge className="absolute -top-2 left-4 z-10 bg-primary text-primary-foreground">
                    <ShieldCheck className="w-3 h-3 mr-1"/>
                    Premium
                </Badge>
                )}
            <CardContent className={cn('flex-1 flex flex-col gap-4', isMapPopup ? 'p-0' : 'p-4')}>
                <div className='flex gap-4'>
                    <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                        <Image
                             src={imageUrl(therapist.image)}
                            alt={therapist.name}
                            fill
                            className="rounded-full object-cover border-2 border-primary/20"
                            data-ai-hint="therapist portrait"
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold font-headline text-lg">{therapist.name}</h3>
                        <p className="text-sm font-semibold text-primary">{therapist.specialty}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <BriefcaseMedical className="w-3 h-3" />
                            <span>{therapist.experience_years} years experience</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{therapist.city}, {therapist.state}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                        <span className="font-semibold text-foreground">{therapist.rating}</span>
                        <span>({therapist.reviews} reviews)</span>
                        </div>
                        {therapist.distance != null && (
                            <div className="flex items-center gap-1">
                                <span>{therapist.distance} km away</span>
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground line-clamp-3">
                        {therapist.bio}
                    </p>
                </div>
                <div className="mt-auto pt-4">
                    <Button asChild size="sm" className="w-full">
                        
                        <Link href={`/therapists/${therapist.name.toLowerCase().replace(/ /g, '-')}`}>View Profile & Book</Link>
                    </Button>
                </div>
            </CardContent>
            </CardComponent>
        );
        }
