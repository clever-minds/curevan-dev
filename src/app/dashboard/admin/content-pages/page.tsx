
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const mockStaticPages = [
    { slug: 'about', title: 'About Us', updatedAt: '2023-10-26T10:00:00Z', status: 'published' },
    { slug: 'legal/terms-of-use', title: 'Terms of Use', updatedAt: '2023-10-26T10:00:00Z', status: 'published' },
    { slug: 'legal/privacy-policy', title: 'Privacy Policy', updatedAt: '2023-10-26T10:00:00Z', status: 'published' },
    { slug: 'contact', title: 'Contact Us', updatedAt: '2023-11-15T10:00:00Z', status: 'draft' },
];

export default function AdminContentPagesPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Content Pages</h1>
            <p className="text-muted-foreground">Edit static pages like legal policies and about us.</p>
        </div>
        <Button disabled>
            <PlusCircle className="mr-2" /> Add New Page
        </Button>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Editable Pages</CardTitle>
           <CardDescription>This feature is a work in progress. A full CMS will be implemented here.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Page Title</TableHead>
                        <TableHead>URL Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockStaticPages.map(page => (
                        <TableRow key={page.slug}>
                            <TableCell className="font-semibold">{page.title}</TableCell>
                            <TableCell className="font-mono text-xs">/{page.slug}</TableCell>
                            <TableCell><Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge></TableCell>
                            <TableCell>{new Date(page.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                 <Button variant="outline" size="sm" disabled>
                                    <Edit className="mr-2" />
                                    Edit
                                </Button>
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
