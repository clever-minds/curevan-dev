
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreVertical, CheckCircle, XCircle, PlusCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn, getSafeDate, downloadCsv } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { KnowledgeBase } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { listJournalEntries } from "@/lib/repos/content";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminJournalPage() {
  const [posts, setPosts] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const fetchPosts = async () => {
      setLoading(true);
      const allPosts = await listJournalEntries();
      setPosts(allPosts);
      setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, []);
  
  const handleApprove = (postId: string, title: string) => {
      // Here you would call a server action to update the post status
      console.log(`Approving post ${postId}`);
      toast({ title: "Post Approved", description: `"${title}" has been published.` });
      // Refetch or update state optimistically
      setPosts(posts.filter(p => p.id !== postId));
  }

  const handleReject = (postId: string, title: string) => {
      // Here you would call a server action to update the post status
      console.log(`Rejecting post ${postId}`);
      toast({ variant: 'destructive', title: "Post Rejected", description: `"${title}" has been rejected and returned to the author.` });
      setPosts(posts.filter(p => p.id !== postId));
  }


  const handleExport = async () => {
    toast({ title: 'Exporting...', description: 'Fetching all journal entries for export.' });
    const allPostsForExport = await listJournalEntries(); // Fetch all posts directly
    const headers = ["ID", "Title", "Slug", "Status", "Author ID", "Author Name", "Tags", "Excerpt", "AI Hint", "Published At", "Created At", "Views", "Unique Views", "Content"];
    const data = allPostsForExport.map(post => [
        post.id,
        post.title,
        post.slug,
        post.status,
        post.authorId,
        post.authorName,
        (post.tags || []).join(', '),
        post.excerpt,
        post.aiHint || '',
        getSafeDate(post.publishedAt)?.toISOString() || '',
        getSafeDate(post.createdAt)?.toISOString() || '',
        post.stats?.totalViews || 0,
        post.stats?.uniqueViews || 0,
        post.content,
    ]);
    downloadCsv(headers, data, 'journal-export-all.csv');
    toast({ title: 'Export Complete!', description: `${allPostsForExport.length} entries have been exported.` });
  };

  const postsForReview = posts.filter(p => p.status === 'pending_review' || p.status === 'draft');
  const handleEdit = (postId: number) => {
          console.log(`Edit post ${postId}`);

        router.push(`/dashboard/journal/${postId}`);
    }
  return (
     <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Journal</h1>
            <p className="text-muted-foreground">Review, approve, and manage all journal entries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}><FileDown className="mr-2"/>Export All</Button>
          <Button asChild>
              <Link href="/dashboard/journal/new">
                  <PlusCircle className="mr-2" />
                  New Entry
              </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Posts Awaiting Review</CardTitle>
          <CardDescription>A list of journal entries that need approval before publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={6}>
                        <Skeleton className="h-20 w-full" />
                    </TableCell>
                </TableRow>
              ) : postsForReview.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <Link href={`/journal/${post.slug}`} className="hover:underline" target="_blank">
                        {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>{post.authorName}</TableCell>
                   <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {post.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="capitalize">{tag}</Badge>
                      ))}
                      {post.tags && post.tags.length > 2 && (
                        <Badge variant="outline">+{post.tags.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={post.status === 'pending_review' ? 'default' : 'secondary'}
                      className={cn(
                          post.status === 'pending_review' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
                          post.status === 'draft' && "bg-gray-100 text-gray-800"
                        )}
                    >
                      {post.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleApprove(post.id, post.title)} className="text-green-600 focus:text-green-700">
                          <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReject(post.id, post.title)} className="text-destructive focus:text-destructive">
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(Number(post.id))}>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
                {postsForReview.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No posts are currently awaiting review.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
