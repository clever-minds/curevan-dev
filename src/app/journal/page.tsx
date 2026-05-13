
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import type { KnowledgeBase } from '@/lib/types';
import { listPublicJournalEntries } from "@/lib/repos/content";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getMediaUrl } from "@/lib/utils";

const PAGE_SIZE = 6; // Number of posts to show per page

export default function JournalPage() {
  const [allPosts, setAllPosts] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const posts = await listPublicJournalEntries();
      setAllPosts(posts);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    return allPosts
      .filter(post => {
        const matchesSearch = (post.title || '').toLowerCase().includes((searchQuery || '').toLowerCase());
        const matchesTag = !selectedTag || (post.tags || []).includes(selectedTag);
        return matchesSearch && matchesTag;
      });
  }, [allPosts, searchQuery, selectedTag]);

  const allTags = useMemo(() => {
    return [...new Set(allPosts.flatMap(post => post.tags || []))];
  }, [allPosts]);

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts;
  const currentPosts = otherPosts.slice(0, visibleCount);
  
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  };
  
  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedTag]);


  return (
    <div className="container mx-auto py-12 md:py-20">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl">
          The Curevan Journal
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Expert insights, wellness tips, and the latest news in therapy and healthcare.
        </p>
      </section>
      

      {/* Main Content and Filters */}
      <section className="space-y-8">
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                    <div className="relative lg:col-span-2">
                        <Input 
                            placeholder="Search articles..." 
                            className="pr-10" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant={selectedTag === null ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => setSelectedTag(null)}
                        >
                            All
                        </Button>
                        {allTags.slice(0, 4).map(tag => (
                            <Button 
                                key={tag} 
                                variant={selectedTag === tag ? 'default' : 'outline'} 
                                size="sm" 
                                className="capitalize"
                                onClick={() => setSelectedTag(tag)}
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
                [...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
            ) : currentPosts.length > 0 ? (
                currentPosts.map((post) => (
                <Card key={post.id} className="group relative flex flex-col overflow-hidden border-none bg-background/40 shadow-lg backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ring-1 ring-white/10">
                    <Link href={`/journal/${post.slug}`}>
                        <CardHeader className="p-0">
                            <div className="relative aspect-video w-full overflow-hidden">
                                <Image
                                    src={getMediaUrl(post.featuredImage as string)}
                                    alt={post.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    data-ai-hint={post.aiHint}
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                {post.tags?.[0] && (
                                    <Badge className="absolute bottom-4 left-4 bg-primary/90 text-white border-none backdrop-blur-md font-bold tracking-wider text-[10px] uppercase px-3">
                                        {post.tags[0]}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                    </Link>
                    <CardContent className="flex-1 p-4">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-primary/70 mb-4 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5"/> 5 min read • {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                        </div>
                        <Link href={`/journal/${post.slug}`}>
                            <CardTitle className="text-xl font-bold font-headline leading-tight group-hover:text-primary transition-colors duration-300 mb-4">
                                {post.title}
                            </CardTitle>
                        </Link>
                        <div 
                            className="text-muted-foreground line-clamp-3 leading-relaxed font-medium opacity-80"
                            dangerouslySetInnerHTML={{ __html: post.excerpt }}
                        />
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-white/5 mt-2 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xs font-bold ring-2 ring-background">
                                {post.authorName?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <p className="text-xs font-bold tracking-wide">{post.authorName}</p>
                                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Author</p>
                            </div>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary group/btn rounded-full px-4">
                            <Link href={`/journal/${post.slug}`} className="text-xs font-bold tracking-widest uppercase">
                                Explore <ArrowRight className="ml-2 h-3 w-3 group-hover/btn:translate-x-1 transition-transform"/>
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))
            ) : filteredPosts.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                    <h3 className="text-2xl font-semibold">No Articles Found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
                </div>
            ) : null}
        </div>
        {otherPosts.length > visibleCount && (
            <div className="mt-12 text-center">
                <Button onClick={handleLoadMore} size="lg">Load More Articles</Button>
            </div>
        )}
      </section>
    </div>
  );
}
