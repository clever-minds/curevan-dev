
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Phone, MapPin, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { getMediaUrl } from '@/lib/utils';
import type { Metadata, ResolvingMetadata } from 'next';
import { getPublicJournalEntryBySlug, listPublicJournalEntries } from '@/lib/repos/content';
import { getTherapistById } from '@/lib/repos/therapists';
import TherapistCard from '@/components/therapist-card';

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

    const allPosts = await listPublicJournalEntries();
    const suggestedPosts = allPosts.filter(p => p.slug !== slug).slice(0, 3);
    const allCategories = [...new Set(allPosts.flatMap(post => post.tags || []))];

    return (
        <div className="container mx-auto py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2">
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

                <div
                    className="prose dark:prose-invert max-w-none text-lg"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

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
                        <ArrowLeft className="mr-2" />
                        Back to Journal
                    </Link>
                </Button>
            </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
            <Card className="bg-primary text-white overflow-hidden group mb-8 border-none shadow-2xl">
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
