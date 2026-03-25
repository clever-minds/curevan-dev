
'use client';

import Image from 'next/image';
import { Star, MessageSquare, MapPin, Briefcase, GraduationCap, Eye, FileText, ArrowRight, Copy } from 'lucide-react';
import { BookingForm } from '@/app/booking/[id]/booking-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Therapist, KnowledgeBase } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';
import { listJournalEntries } from '@/lib/repos/content';
import { BookOpen } from 'lucide-react';
import { imageUrl } from '@/lib/image';

export function TherapistProfileClient({ therapist, authoredPosts }: { therapist: Therapist, authoredPosts: KnowledgeBase[] }) {
  const { toast } = useToast();

  const referralLink = `/ecommerce?ref=${therapist.referralCode}`;

  const handleCopyCode = () => {
    if (!therapist.referralCode) return;
    navigator.clipboard.writeText(therapist.referralCode);
    toast({
        title: "Code Copied!",
        description: `Referral code ${therapist.referralCode} has been copied to your clipboard.`
    })
  }

  const journalStats = useMemo(() => {
    return {
        postCount: authoredPosts.length,
        totalViews: authoredPosts.reduce((sum, post) => sum + (post.stats?.totalViews || 0), 0)
    }
  }, [authoredPosts]);

  return (
    <div className="bg-muted/30">
        <div className="container mx-auto max-w-6xl py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
                {/* Header Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <Image
                                    src={imageUrl(therapist.image)}
                                    alt={therapist.name}
                                    fill
                                    className="rounded-full object-cover border-4 border-white shadow-lg"
                                    data-ai-hint="therapist portrait"
                                />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold font-headline">{therapist.name}</h1>
                                <p className="text-lg text-primary font-semibold">{therapist.specialty}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                        <span className="font-semibold text-foreground">{therapist.rating}</span>
                                        ({therapist.reviews} reviews)
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{therapist.experience_years} years experience</span>
                                    </div>
                                     <div className="flex items-center gap-1.5">
                                        <Eye className="w-4 h-4" />
                                        <span>{therapist.profileViewCount} profile views</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                                    <MapPin className="w-4 h-4" /> {therapist.city}, {therapist.state}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                 {/* Referral Code Card */}
                {therapist.referralCode && (
                    <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
                        <CardHeader>
                            <CardTitle>Shop with my code</CardTitle>
                            <CardDescription>Use this code at checkout to get {therapist.referralDiscountRate! * 100}% off on eligible products.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="p-3 border-2 border-dashed border-primary/50 rounded-lg flex items-center gap-2">
                                <span className="font-mono text-2xl font-bold tracking-widest text-primary">{therapist.referralCode}</span>
                                <Button variant="ghost" size="icon" onClick={handleCopyCode}><Copy className="w-5 h-5"/></Button>
                            </div>
                            <Button asChild>
                                <Link href={referralLink}>Shop with Code</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}


                {/* About Section */}
                <Card>
                    <CardHeader><CardTitle>About Me</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{therapist.bio}</p>
                    </CardContent>
                </Card>

                 {/* Qualifications Section */}
                <Card>
                    <CardHeader><CardTitle>Qualifications & Certifications</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {therapist.qualifications.map((q, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <GraduationCap className="w-5 h-5 text-primary"/>
                                    <span className="font-medium">{q}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                
                {/* Journal Stats Section */}
                {journalStats.postCount > 0 && (
                <Card>
                    <CardHeader><CardTitle>Journal Insights</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-bold">{journalStats.postCount}</p>
                            <p className="text-sm text-muted-foreground">Articles Written</p>
                        </div>
                         <div className="p-4 bg-muted/50 rounded-lg">
                            <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-bold">{journalStats.totalViews.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Total Article Views</p>
                        </div>
                    </CardContent>
                </Card>
                )}


                 {/* Authored Content Section */}
                {authoredPosts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Articles by {therapist.name.split(' ')[0]}</CardTitle>
                            <CardDescription>Read expert insights from {therapist.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {authoredPosts.map(post => (
                             <Link key={post.id} href={`/journal/${post.slug}`} className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                <h4 className="font-semibold">{post.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                                <p className="text-xs text-muted-foreground mt-2">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</p>
                             </Link>
                           ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Right Column (Booking Form) */}
            <div className="lg:col-span-1">
                <div className="sticky top-24">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold font-headline text-center">Book an Appointment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BookingForm therapist={therapist} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        </div>
    </div>
  );
}
