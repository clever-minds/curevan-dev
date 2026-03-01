
'use client';

import { useEffect, useState } from 'react';
import type { Training } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { listTrainings } from '@/lib/repos/content';
import { getTherapyCategories } from '@/lib/repos/meta';

export const dynamic = 'force-dynamic';

const FilterContent = ({ therapyCategories }: { therapyCategories: string[] }) => (
    <div className="space-y-4">
        <div>
            <label className="text-sm font-medium">Category</label>
            <Select>
                <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                    {therapyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div>
            <label className="text-sm font-medium">Difficulty</label>
            <Select>
                <SelectTrigger><SelectValue placeholder="Any Difficulty" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <label className="text-sm font-medium">Duration</label>
            <Select>
                <SelectTrigger><SelectValue placeholder="Any Duration" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="15">≤15m</SelectItem>
                    <SelectItem value="30">15–30m</SelectItem>
                    <SelectItem value="60">30–60m</SelectItem>
                    <SelectItem value="61">60m+</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Button className="w-full">Apply Filters</Button>
    </div>
);


export default function TrainingCoursesPage() {
    const [filteredTrainings, setFilteredTrainings] = useState<Training[]>([]);
    const [therapyCategories, setTherapyCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchTrainings = async () => {
            const [data, cats] = await Promise.all([
                listTrainings(),
                getTherapyCategories(),
            ]);
            setFilteredTrainings(data);
            setTherapyCategories(cats);
        }
        fetchTrainings();
    }, []);

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">Training</h1>
                <p className="text-muted-foreground">Browse all available training courses to enhance your clinical and operational skills.</p>
            </div>
            
            {/* Filter Bar */}
            <div className="p-4 border rounded-lg bg-card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Input placeholder="Search courses..." className="pl-10" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                     <div className="hidden md:flex gap-4">
                         <Select>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent>
                                {therapyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Any Difficulty" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="md:hidden">
                                <SlidersHorizontal className="mr-2 w-5 h-5"/>
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh]">
                            <SheetHeader className="mb-4">
                               <SheetTitle>Course Filters</SheetTitle>
                               <SheetDescription>Refine your search to find the perfect course.</SheetDescription>
                            </SheetHeader>
                            <div className="h-[calc(100%-80px)] overflow-y-auto pr-4">
                               <FilterContent therapyCategories={therapyCategories} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>


            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainings.map(training => (
                    <Card key={training.id} className="flex flex-col group">
                        <Link href={`/training/${training.slug}`} className="block">
                             <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                                <Image 
                                    src={training.coverImageUrl}
                                    alt={training.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                    data-ai-hint="abstract texture"
                                />
                             </div>
                        </Link>
                        <CardContent className="p-4 flex-1">
                             <div className="flex flex-wrap gap-1 mb-2">
                                {training.categoryIds.map(cat => (
                                    <Badge key={cat} variant="secondary">{cat}</Badge>
                                ))}
                            </div>
                            <Link href={`/training/${training.slug}`} className="block">
                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{training.title}</CardTitle>
                            </Link>
                             <CardDescription className="mt-1 text-sm line-clamp-2">{training.excerpt}</CardDescription>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-muted-foreground">
                            <Badge variant="outline" className="capitalize">{training.difficulty}</Badge>
                            <span>{training.durationMin} min</span>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
