

'use client';

import { useState, useEffect } from "react";
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
import { MoreVertical, PlusCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn, getSafeDate, downloadCsv } from "@/lib/utils";
import type { Documentation } from "@/lib/types";
import { listDocumentation } from "@/lib/repos/content";

export const dynamic = 'force-dynamic';

export default function AdminDocumentationPage() {
  const [docList, setDocList] = useState<Documentation[]>([]);

  useEffect(() => {
    async function fetchDocs() {
        const data = await listDocumentation();
        setDocList(data);
    }
    fetchDocs();
  }, []);

  const handleExport = () => {
    const headers = ["ID", "Title", "Slug", "Status", "Categories", "SOP Version", "Author ID", "Published At", "Created At", "Excerpt", "Content"];
    const data = docList.map(doc => [
        doc.id,
        doc.title,
        doc.slug,
        doc.status,
        doc.categoryIds.join(', '),
        doc.sopVersion,
        doc.authorId,
        getSafeDate(doc.publishedAt)?.toISOString() || '',
        getSafeDate(doc.createdAt)?.toISOString() || '',
        doc.excerpt,
        doc.content,
    ]);
    downloadCsv(headers, data, 'documentation-export.csv');
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Documentation</h1>
              <p className="text-muted-foreground">Create and manage Standard Operating Procedures (SOPs).</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2"/>Export All</Button>
            <Button asChild>
              <Link href="/dashboard/admin/documentation/new">
                  <PlusCircle className="mr-2" />
                  Add New Document
              </Link>
            </Button>
          </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SOP Library</CardTitle>
          <CardDescription>A list of all SOPs and documentation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docList.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doc.sopVersion}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {doc.categoryIds.map(cat => <Badge key={cat} variant="outline">{cat}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={cn(
                        doc.status === "published" && "bg-green-100 text-green-800",
                        doc.status === "draft" && "bg-yellow-100 text-yellow-800",
                      )}
                      variant="secondary"
                    >
                      {doc.status}
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Preview</DropdownMenuItem>
                        <DropdownMenuItem>Publish</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
