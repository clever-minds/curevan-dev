
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listDocumentation } from '@/lib/repos/content';
import { getTherapyCategories } from '@/lib/repos/meta';
import type { KnowledgeBase } from '@/lib/types';
import { FilterBar } from '@/components/admin/FilterBar';

export const dynamic = 'force-dynamic';

export default function SopLibraryPage() {
    const [filteredDocs, setFilteredDocs] = useState<KnowledgeBase[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            const docs = await listDocumentation();
            setFilteredDocs(docs);
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">SOP Library</h1>
                <p className="text-muted-foreground">Browse all Standard Operating Procedures.</p>
            </div>
            
            <FilterBar showSearch showTherapyFilters />

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocs.map(doc => (
                    <Link href={`/sop/${doc.slug}`} key={doc.id} className="block group">
                        <Card className="h-full hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="group-hover:text-primary">{doc.title}</CardTitle>
                                    <Badge variant="outline">{doc.sopVersion}</Badge>
                                </div>
                                <CardDescription>{doc.excerpt}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
