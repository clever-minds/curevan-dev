
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Facebook, Twitter, Linkedin, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { getMediaUrl } from '@/lib/utils';
import type { Metadata, ResolvingMetadata } from 'next';
import { getPublicJournalEntryBySlug, listPublicJournalEntries } from '@/lib/repos/content';
import { getTherapistById } from '@/lib/repos/therapists';
import TherapistCard from '@/components/therapist-card';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublicJournalEntryBySlug(slug);

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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicJournalEntryBySlug(slug);

  if (!post) {
    notFound();
  }

  const author = await getTherapistById(post.authorId);
  const youtubeVideoId = post.videoUrl ? new URL(post.videoUrl).searchParams.get('v') : null;

  // Fetch suggested posts
  const allPosts = await listPublicJournalEntries();
  const suggestedPosts = allPosts
    .filter(p => p.id !== post.id)
    .sort((a, b) => {
        const aCommonTags = (a.tags || []).filter(tag => (post.tags || []).includes(tag)).length;
        const bCommonTags = (b.tags || []).filter(tag => (post.tags || []).includes(tag)).length;
        return bCommonTags - aCommonTags;
    })
    .slice(0, 4);

  const allCategories = Array.from(new Set(allPosts.flatMap(p => p.categories || []))).slice(0, 10);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:px-8 max-w-7xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8">
            <article>
                <header className="mb-12">
                    <div className="mb-6 flex flex-wrap gap-2">
                        {post.categories && post.categories.length > 0 && post.categories.map(cat => (
                            <Badge key={cat} variant="default" className="bg-primary hover:bg-primary px-3 py-1 text-[10px] font-bold tracking-[0.1em] uppercase">
                                {cat}
                            </Badge>
                        ))}
                        {post.tags && post.tags.length > 0 && post.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="px-3 py-1 text-[10px] font-bold tracking-[0.1em] uppercase">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl lg:text-6xl mb-8 leading-tight">{post.title}</h1>

                    <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y mb-8">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-2">
                                <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            {post.stats?.totalViews && post.stats.totalViews > 0 && (
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    <span>{post.stats.totalViews.toLocaleString()} views</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mr-2">Share</span>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"><Facebook className="w-4 h-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"><Twitter className="w-4 h-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"><Linkedin className="w-4 h-4"/></Button>
                        </div>
                    </div>

                    <div className="mb-12">
                        {post.images && post.images.length > 1 ? (
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {post.images.map((img, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative h-72 w-full rounded-2xl overflow-hidden md:h-[500px] shadow-2xl shadow-primary/5">
                                                <Image
                                                    src={getMediaUrl(img)}
                                                    alt={`${post.title} - Image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    priority={index === 0}
                                                    unoptimized
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <div className="hidden md:block">
                                    <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-md" />
                                    <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-md" />
                                </div>
                            </Carousel>
                        ) : (
                            <div className="relative h-72 w-full rounded-2xl overflow-hidden md:h-[500px] shadow-2xl shadow-primary/5">
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
                        )}
                    </div>
                </header>

                {author && (
                    <div className="mb-12 bg-accent/30 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-6">Author details</h2>
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                             <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                                <AvatarImage src={author.image} alt={author.name} className="object-cover" />
                                <AvatarFallback className="text-2xl font-bold">{author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold font-headline mb-3">{author.name}</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                                    {author.bio || `Expert in ${author.specialty} with ${author.experience_years} years of experience. Dedicated to providing high-quality therapy and wellness guidance.`}
                                </p>
                                <Button asChild variant="link" className="p-0 h-auto text-primary font-bold">
                                    <Link href={`/tp/${author.id}`}>View Profile</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div 
                className="prose dark:prose-invert max-w-none text-xl leading-relaxed font-serif"
                dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {youtubeVideoId && (
                    <div className="mt-12 group">
                        <div className="aspect-w-16 aspect-h-9 relative rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
                            <iframe 
                                className="w-full h-full"
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

            <div className="mt-16 pt-8 border-t flex items-center justify-between">
                <Button asChild variant="ghost" className="hover:bg-primary/10 rounded-full px-6 group">
                    <Link href="/journal">
                        <ArrowLeft className="mr-3 transition-transform group-hover:-translate-x-1"/>
                        Back to Journal
                    </Link>
                </Button>
                <div className="flex gap-4">
                     <Button variant="outline" size="icon" className="rounded-full"><Share2 className="w-4 h-4"/></Button>
                </div>
            </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-10">
            {/* Professional Help Block */}
            <Card className="bg-primary text-white border-none shadow-xl overflow-hidden group">
                <div className="p-6 relative">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <h3 className="text-xl font-bold mb-4 relative z-10">Need Professional Consultation?</h3>
                    <p className="text-white/80 text-sm mb-6 relative z-10">Get expert advice from our certified therapists for your specific condition.</p>
                    <div className="space-y-4 relative z-10">
                        <Button asChild className="w-full bg-white text-primary hover:bg-white/90 font-bold">
                            <Link href="/therapists">Book Appointment</Link>
                        </Button>
                        <div className="flex items-center gap-3 text-xs font-medium pt-2 border-t border-white/20">
                            <Phone className="w-3.5 h-3.5" />
                            <span>+91 951 444 6292</span>
                        </div>
                    </div>
                </div>
            </Card>

            {suggestedPosts.length > 0 && (
                <div className="sticky top-24 space-y-10">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 border-b pb-4">More to explore</h2>
                        <div className="flex flex-col gap-6">
                            {suggestedPosts.map((sPost) => (
                            <div key={sPost.id} className="group flex gap-4 items-start">
                                <Link href={`/journal/${sPost.slug}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
                                    <Image
                                        src={getMediaUrl(sPost.featuredImage as string)}
                                        alt={sPost.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        unoptimized
                                    />
                                </Link>
                                <div className="flex flex-col gap-1">
                                    <Link href={`/journal/${sPost.slug}`}>
                                        <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                            {sPost.title}
                                        </h3>
                                    </Link>
                                    <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                                        {new Date(sPost.publishedAt || sPost.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>

                    {allCategories.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 border-b pb-4">Categories</h2>
                            <div className="flex flex-wrap gap-2">
                                {allCategories.map(cat => (
                                    <Link key={cat} href={`/journal?category=${cat}`}>
                                        <Badge variant="outline" className="hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer px-3 py-1 font-medium">
                                            {cat}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-6 bg-muted/50 rounded-2xl border">
                         <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Contact Info</h3>
                         <div className="space-y-4 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                                <span>Vadodara, Gujarat, 390012</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-primary" />
                                <span>care@curevan.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-primary" />
                                <span>www.curevan.com</span>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </aside>
      </div>
    </div>
  );
}
