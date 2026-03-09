
'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Layers, Download, Printer, GitCommitVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { listDocumentation } from '@/lib/repos/content';
import { useEffect, useState } from 'react';
import type { KnowledgeBase } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SopDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [doc, setDoc] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      const allDocs = await listDocumentation();
      const foundDoc = allDocs.find((d) => d.slug === slug);
      if (foundDoc) {
        setDoc(foundDoc);
      } else {
        notFound();
      }
      setLoading(false);
    };

    if (slug) {
      fetchDoc();
    }
  }, [slug]);
  
  if (loading) {
      return (
          <div className="container mx-auto max-w-4xl py-8 md:py-12 space-y-8">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-12 w-3/4" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
          </div>
      )
  }

  if (!doc) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 md:py-12">
        <Breadcrumb className="mb-8">
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/dashboard/therapist/training">Training</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
             <BreadcrumbSeparator />
             <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/dashboard/therapist/training/sops">SOP Library</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>{doc.title}</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
      <article>
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5"><Layers className="w-4 h-4"/> Categories: {doc.categories}</div>
            <div className="flex items-center gap-1.5"><GitCommitVertical className="w-4 h-4"/> Version: {doc.sopVersion}</div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl mb-4">{doc.title}</h1>
           <p className="text-lg text-muted-foreground">{doc.excerpt}</p>
        </header>

        <div className="prose dark:prose-invert max-w-none text-lg border-t pt-8 mt-8">
          <p>{doc.content}</p>
        </div>
      </article>

       <div className="mt-8 flex gap-2">
         <Button asChild variant="outline">
            <Link href="/dashboard/therapist/training/sops">
                <ArrowLeft className="mr-2"/>
                Back to SOPs
            </Link>
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="mr-2"/>
            Print this SOP
        </Button>
      </div>

    </div>
  );
}
