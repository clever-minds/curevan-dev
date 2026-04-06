
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { getMediaUrl } from '@/lib/utils';
import type { Metadata, ResolvingMetadata } from 'next';
import { getKnowledgeBaseBySlug } from '@/lib/repos/content';
import { getTherapistById } from '@/lib/repos/therapists';
import TherapistCard from '@/components/therapist-card';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug
  const post = await getKnowledgeBaseBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found',
      description: 'The article you are looking for does not exist.',
    }
  }

  return {
    title: `${post.title} | Curevan Journal`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.featuredImage as string,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getKnowledgeBaseBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const author = await getTherapistById(post.authorId);
  const youtubeVideoId = post.videoUrl ? new URL(post.videoUrl).searchParams.get('v') : null;

  return (
    <div className="container mx-auto max-w-4xl py-8 md:py-12">
        <Breadcrumb className="mb-8">
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/journal">Journal</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
      <article>
        <header className="mb-8">
          <div className="relative h-72 w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={getMediaUrl(post.featuredImage as string)}
              alt={post.title}
              fill
              className="object-cover"
              data-ai-hint={post.aiHint}
              priority
              unoptimized
            />
          </div>
          {post.tags && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
            )}
          <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {author && (
              <Link href={`/tp/${author.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={author.image} alt={author.name} data-ai-hint="therapist portrait" />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{author.name}</span>
              </Link>
            )}
             <span>&bull;</span>
             <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
             {post.stats?.totalViews && post.stats.totalViews > 0 && (
                <>
                    <span>&bull;</span>
                    <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>{post.stats.totalViews.toLocaleString()} views</span>
                    </div>
                </>
             )}
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none text-lg">
          <p>{post.content}</p>
        </div>

        {youtubeVideoId && (
            <div className="mt-8">
                <div className="aspect-w-16 aspect-h-9">
                    <iframe 
                        className="w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen>
                    </iframe>
                </div>
            </div>
        )}
      </article>

      {author && (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>About the Author</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="max-w-md">
                    <TherapistCard therapist={author} />
                </div>
            </CardContent>
        </Card>
      )}

       <div className="mt-8">
         <Button asChild variant="outline">
            <Link href="/journal">
                <ArrowLeft className="mr-2"/>
                Back to Journal
            </Link>
        </Button>
      </div>

    </div>
  );
}
