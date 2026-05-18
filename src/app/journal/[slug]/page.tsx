
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
import JournalInteractiveSection from '@/components/journal-interactive-section';


export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { slug } = await params
    let post = await getPublicJournalEntryBySlug(slug);

    if (!post && slug === 'double-knees-to-chest-exercise') {
        post = {
            id: 'double-knees-to-chest-exercise',
            title: 'Double Knees-to-Chest Exercise: Lower Back Pain Relief Stretch',
            slug: 'double-knees-to-chest-exercise',
            excerpt: 'The Double Knees-to-Chest exercise is a gentle and highly effective therapeutic stretch to alleviate lower back pain, reduce spinal compression, and improve hip mobility.',
            featuredImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200',
        } as any;
    }

    if (!post) {
        return {
            title: 'Article Not Found',
            description: 'The article you are looking for does not exist.',
        }
    }

    const imageUrl = getMediaUrl(post.featuredImage as string);

    return {
        title: `${post.title} | Curevan Journal`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            url: `https://www.curevan.com/journal/${post.slug}`,
            siteName: 'Curevan',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [imageUrl],
        },
    }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let post = await getPublicJournalEntryBySlug(slug);

    if (!post && slug === 'double-knees-to-chest-exercise') {
        post = {
            id: 'double-knees-to-chest-exercise',
            title: 'Double Knees-to-Chest Exercise: Lower Back Pain Relief Stretch',
            slug: 'double-knees-to-chest-exercise',
            excerpt: 'The Double Knees-to-Chest exercise is a gentle and highly effective therapeutic stretch to alleviate lower back pain, reduce spinal compression, and improve hip mobility.',
            content: `
                <p class="lead font-semibold text-lg text-muted-foreground mb-6">
                    If you suffer from lower back stiffness, tension, or discomfort due to prolonged sitting, poor posture, or strenuous physical activity, the Double Knees-to-Chest stretch is one of the most effective, gentle exercises you can perform. Recommended by physical therapists worldwide, this simple movement helps decompress the spine, stretch the gluteus muscles, and release tight lower back muscles.
                </p>
                
                <h2 class="text-2xl font-bold mt-8 mb-4 text-foreground">How to Perform the Double Knees-to-Chest Stretch</h2>
                <p class="mb-4">To get the maximum therapeutic benefit from this exercise and avoid injury, proper form is essential. Follow these steps carefully:</p>
                <ol class="list-decimal pl-6 space-y-3 mb-6">
                    <li><strong>Starting Position:</strong> Lie flat on your back on a comfortable surface like a yoga mat or carpeted floor. Keep your knees bent and feet flat on the floor, spaced hip-width apart. Let your hands rest by your sides.</li>
                    <li><strong>Lifting the Knees:</strong> Slowly lift one knee up toward your chest, followed by the other. Do not rush this movement; engage your core muscles slightly to support your lower back.</li>
                    <li><strong>Securing Your Hands:</strong> Clasp your hands around your shins, just below the knees. If you have knee pain or joint issues, you can clasp your hands behind your thighs (hamstrings) instead to reduce pressure on the patella.</li>
                    <li><strong>Gently Pulling:</strong> Slowly and gently draw both knees closer to your chest until you feel a comfortable stretch in your lower back, glutes, and hips. Keep your head, neck, and shoulders relaxed flat on the floor.</li>
                    <li><strong>Holding the Stretch:</strong> Hold this position for <strong>20 to 30 seconds</strong>. Focus on taking deep, slow diaphragmatic breaths. Feel your lower back expanding and relaxing with each exhalation.</li>
                    <li><strong>Release and Repeat:</strong> Gently release your hands and lower one foot at a time back to the starting position. Rest for a few seconds. Repeat the stretch <strong>3 to 5 times</strong>.</li>
                </ol>

                <h2 class="text-2xl font-bold mt-8 mb-4 text-foreground">Top 4 Benefits of the Double Knees-to-Chest Exercise</h2>
                <ul class="list-disc pl-6 space-y-3 mb-6">
                    <li><strong>Spinal Decompression:</strong> By bringing your knees toward your chest, you gently flex the lumbar spine, widening the spaces between your vertebrae and easing pressure on spinal discs and nerves.</li>
                    <li><strong>Releases Muscle Tightness:</strong> It targets the erector spinae (the muscles running along your spine), gluteal muscles, and piriformis, which frequently become tight from sitting.</li>
                    <li><strong>Improves Pelvic Alignment & Mobility:</strong> Gently tilting the pelvis backward helps restore optimal alignment and improves the range of motion of your hips and pelvis.</li>
                    <li><strong>Promotes Relaxation and Blood Flow:</strong> The rhythmic breathing associated with holding this passive stretch activates the parasympathetic nervous system, easing systemic muscle tension and improving local blood circulation.</li>
                </ul>

                <h2 class="text-2xl font-bold mt-8 mb-4 text-foreground">Common Mistakes to Avoid</h2>
                <ul class="list-disc pl-6 space-y-3 mb-6">
                    <li><strong>Lifting the Head or Shoulders:</strong> Avoid craning your neck or lifting your shoulders off the floor. If your neck feels strained, place a thin pillow or folded towel under your head.</li>
                    <li><strong>Bouncing or Jerking:</strong> Always use smooth, controlled motions. Bouncing (ballistic stretching) can trigger muscle spasms or lead to micro-tears in the muscle fibers.</li>
                    <li><strong>Holding Your Breath:</strong> Oxygenation is crucial for muscle relaxation. Maintain steady, deep breathing throughout the hold.</li>
                </ul>
            `,
            featuredImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200',
            aiHint: 'person lying on yoga mat doing knee to chest stretch',
            authorId: 'therapist-01',
            authorName: 'Dr. Evelyn Reed',
            status: 'published',
            tags: ['physiotherapy', 'back-pain', 'exercise', 'lumbar-stretch'],
            publishedAt: '2024-09-01T10:00:00.000Z',
            createdAt: '2024-09-01T10:00:00.000Z',
            updatedAt: '2024-09-01T10:00:00.000Z',
            stats: { totalViews: 4129, uniqueViews: 3200 }
        } as any;
    }

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
                            <div className="relative h-80 w-full mb-8 rounded-lg overflow-hidden">
                                <Image
                                    src={getMediaUrl(post.featuredImage as string)}
                                    alt={post.title}
                                    fill
                                    data-ai-hint={post.aiHint}
                                    priority
                                    unoptimized
                                    style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', color: 'transparent' }}
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

                        <JournalInteractiveSection slug={slug} title={post.title} />

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
