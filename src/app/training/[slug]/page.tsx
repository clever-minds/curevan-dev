

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, BarChart, Layers, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import type { Metadata, ResolvingMetadata } from 'next';
import { listTrainings } from '@/lib/repos/content';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const allTrainings = await listTrainings();
  const training = allTrainings.find((t) => t.slug === slug);

  if (!training) {
    return {
      title: 'Training Not Found',
      description: 'The training course you are looking for does not exist.',
    }
  }

  return {
    title: `${training.title} | Curevan Training`,
    description: training.excerpt,
  }
}

export default async function TrainingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allTrainings = await listTrainings();
  const training = allTrainings.find((t) => t.slug === slug);

  if (!training) {
    notFound();
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
                    <Link href="/dashboard/therapist/training/courses">Courses</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>{training.title}</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
      <article>
        <header className="mb-8">
          <div className="relative h-72 w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={training.coverImageUrl}
              alt={training.title}
              fill
              className="object-cover"
              data-ai-hint="abstract professional background"
              priority
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5"><Layers className="w-4 h-4"/> Categories: {training.categoryIds.join(', ')}</div>
            <div className="flex items-center gap-1.5"><BarChart className="w-4 h-4"/> <span className="capitalize">{training.difficulty}</span></div>
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {training.durationMin} min read</div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl mb-4">{training.title}</h1>
        </header>

        <div className="prose dark:prose-invert max-w-none text-lg">
          <p>{training.content}</p>
        </div>

      </article>

      {training.attachments && training.attachments.length > 0 && (
          <Card className="mt-12">
            <CardHeader>
                <CardTitle>Attachments & Downloads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {training.attachments.map((file, i) => (
                    <div key={i} className="p-3 border rounded-md flex items-center justify-between">
                        <span>{file.name}</span>
                        <Button asChild variant="outline" size="sm">
                            <a href={file.url} download>
                                <Download className="mr-2"/>
                                Download
                            </a>
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
      )}


       <div className="mt-8 flex gap-2">
         <Button asChild variant="outline">
            <Link href="/dashboard/therapist/training/courses">
                <ArrowLeft className="mr-2"/>
                Back to Courses
            </Link>
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="mr-2"/>
            Print this page
        </Button>
      </div>

    </div>
  );
}
