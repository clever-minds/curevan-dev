
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import type { JournalEntry } from '@/lib/types';
import { listJournalEntries } from "@/lib/repos/content";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6; // Number of posts to show per page

export default function JournalPage() {
  const [allPosts, setAllPosts] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const posts = await listJournalEntries({ status: 'published' });
      setAllPosts(posts);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    return allPosts
      .filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = !selectedTag || post.tags?.includes(selectedTag);
        return matchesSearch && matchesTag;
      });
  }, [allPosts, searchQuery, selectedTag]);

  const allTags = useMemo(() => {
    return [...new Set(allPosts.flatMap(post => post.tags || []))];
  }, [allPosts]);

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);
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
      
      {/* Featured Post */}
      {loading ? (
        <Skeleton className="h-96 w-full mb-16" />
      ) : featuredPost && (
        <section className="mb-16">
          <Link href={`/journal/${featuredPost.slug}`}>
            <Card className="grid md:grid-cols-2 overflow-hidden group border-2 hover:border-primary transition-all duration-300">
                <CardContent className="p-8 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-4">Featured Article</Badge>
                    <CardTitle className="text-3xl font-bold font-headline mb-4 group-hover:text-primary transition-colors">{featuredPost.title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground mb-6 line-clamp-3">{featuredPost.excerpt}</CardDescription>
                    <div className="flex items-center gap-4 text-sm">
                        <p className="font-semibold">{featuredPost.authorName}</p>
                        <p className="text-muted-foreground">{new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString()}</p>
                    </div>
                </CardContent>
                <div className="relative h-64 md:h-full min-h-[250px]">
                    <Image
                        src={featuredPost.featuredImage as string}
                        alt={featuredPost.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        data-ai-hint={featuredPost.aiHint}
                    />
                </div>
            </Card>
          </Link>
        </section>
      )}

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
                <Card key={post.id} className="flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <Link href={`/journal/${post.slug}`}>
                        <CardHeader className="p-0">
                            <div className="relative h-48 w-full overflow-hidden">
                                <Image
                                    src={post.featuredImage as string}
                                    alt={post.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    data-ai-hint={post.aiHint}
                                />
                            </div>
                        </CardHeader>
                    </Link>
                    <CardContent className="flex-1 p-6">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {post.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                    <Link href={`/journal/${post.slug}`}>
                        <CardTitle className="text-xl font-bold font-headline group-hover:text-primary transition-colors">{post.title}</CardTitle>
                    </Link>
                    </CardContent>
                    <CardFooter className="p-6 pt-0 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-semibold">{post.authorName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/journal/${post.slug}`}>Read More <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))
            ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                    <h3 className="text-2xl font-semibold">No Articles Found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
                </div>
            )}
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
