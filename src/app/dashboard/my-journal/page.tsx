
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Eye, Copy, Trash2, FilePlus, BarChart, FileDown, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/admin/FilterBar';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn, getSafeDate, downloadCsv } from '@/lib/utils';
import Link from 'next/link';
import type { JournalEntry } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { listJournalEntries } from '@/lib/repos/content';

export const dynamic = 'force-dynamic';

const KpiCard = ({ title, value }: { title: string, value: number | string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const PostActions = ({ post }: { post: JournalEntry }) => {
    const router = useRouter();

   const handleEdit = () => {
        router.push(`/dashboard/journal/${post.id}`);
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}><Edit className="mr-2"/>Edit</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href={`/journal/${post.slug}`} target="_blank"><Eye className="mr-2"/>View Public</Link></DropdownMenuItem>
                <DropdownMenuItem><Copy className="mr-2"/>Duplicate</DropdownMenuItem>
                {post.status === 'draft' && <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2"/>Delete</DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const PostCard = ({ post }: { post: JournalEntry }) => (
    <Card>
        <CardContent className="p-4">
            <div className="flex justify-between items-start">
                <p className="font-bold line-clamp-2">{post.title}</p>
                 <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={cn(post.status === 'published' && 'bg-green-100 text-green-800')}>{post.status}</Badge>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>Updated: {getSafeDate(post.updatedAt)?.toLocaleDateString()}</p>
                <p>Views: {post.stats?.totalViews?.toLocaleString() || 0}</p>
            </div>
             <div className="mt-2 flex justify-end">
                <PostActions post={post} />
            </div>
        </CardContent>
    </Card>
)

export default function MyJournalPage() {
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const [authorPosts, setAuthorPosts] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchPosts = async () => {
                setLoading(true);
                const allPosts = await listJournalEntries();
                setAuthorPosts(allPosts);
                setLoading(false);
                        console.log("User in allPosts:", allPosts);

            };
            fetchPosts();
        }
    }, [user]);

    const postStats = useMemo(() => {
        return {
            totalViews: authorPosts.reduce((sum, p) => sum + (p.stats?.totalViews || 0), 0),
            published: authorPosts.filter(p => p.status === 'published').length,
            drafts: authorPosts.filter(p => p.status === 'draft').length,
            inReview: authorPosts.filter(p => p.status === 'pending_review').length,
        }
    }, [authorPosts]);
    
    const handleExport = () => {
        const headers = [
            "ID", "Title", "Slug", "Status", "Tags", "Video URL", 
            "Total Views", "Unique Views", "Published At", "Created At", "Updated At",
            "Excerpt", "Content"
        ];
        
        const data = authorPosts.map(post => [
            post.id,
            post.title,
            post.slug,
            post.status,
            post.tags?.join(', ') || '',
            post.videoUrl || '',
            post.stats?.totalViews || 0,
            post.stats?.uniqueViews || 0,
            getSafeDate(post.publishedAt)?.toISOString() || '',
            getSafeDate(post.createdAt)?.toISOString() || '',
            getSafeDate(post.updatedAt)?.toISOString() || '',
            post.excerpt,
            post.content
        ]);
        
        downloadCsv(headers, data, 'my-journal-export.csv');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">My Journal</h1>
                    <p className="text-muted-foreground">Manage your articles, track their performance, and create new content.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/> Print</Button>
                    <Button onClick={handleExport}><FileDown className="mr-2"/> Export CSV</Button>
                    <Button asChild><Link href="/dashboard/journal/new"><FilePlus className="mr-2"/> New Entry</Link></Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Views" value={postStats.totalViews.toLocaleString()} />
                <KpiCard title="Published Posts" value={postStats.published} />
                <KpiCard title="Drafts" value={postStats.drafts} />
                <KpiCard title="In Review" value={postStats.inReview} />
            </div>

            <FilterBar showDatePicker showSearch />

            {loading ? (
                 <Skeleton className="w-full h-48" />
            ) : isMobile ? (
                <div className="space-y-4">
                    {authorPosts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead>Views</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {authorPosts.map(post => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell><Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={cn(post.status === 'published' && 'bg-green-100 text-green-800')}>{post.status.replace('_', ' ')}</Badge></TableCell>
                                        <TableCell>{getSafeDate(post.updatedAt)?.toLocaleDateString()}</TableCell>
                                        <TableCell>{post.stats?.totalViews?.toLocaleString() || 0}</TableCell>
                                        <TableCell className="text-right"><PostActions post={post} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {!loading && authorPosts.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p className="mb-2">You haven’t written anything yet.</p>
                        <Button asChild><Link href="/dashboard/journal/new">Write Your First Entry</Link></Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
