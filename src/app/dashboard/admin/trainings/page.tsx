
'use client';

import { useEffect, useState } from "react";
import type { Training } from "@/lib/types";
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
import { listTrainings } from "@/lib/repos/content";
import { FilterBar } from "@/components/admin/FilterBar";

export default function AdminTrainingsPage() {
  // In a real app, this would be fetched from Firestore
  const [trainingList, setTrainingList] = useState<Training[]>([]);

  useEffect(() => {
    const fetchTrainings = async () => {
        const data = await listTrainings();
        setTrainingList(data);
    };
    fetchTrainings();
  }, []);

  const handleExport = () => {
    const headers = ["ID", "Title", "Slug", "Status", "Categories", "Difficulty", "Duration (min)", "Author ID", "Published At", "Created At", "Excerpt", "Content"];
    const data = trainingList.map(item => [
        item.id,
        item.title,
        item.slug,
        item.status,
        item.categoryIds.join(', '),
        item.difficulty,
        item.durationMin,
        item.authorId,
        getSafeDate(item.publishedAt)?.toISOString() || '',
        getSafeDate(item.createdAt)?.toISOString() || '',
        item.excerpt,
        item.content,
    ]);
    downloadCsv(headers, data, 'trainings-export.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Trainings</h1>
              <p className="text-muted-foreground">Create, edit, and publish training courses for therapists.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2"/>Export All</Button>
            <Link href="/dashboard/admin/trainings/new">
                <Button>
                    <PlusCircle className="mr-2" />
                    Add New Training
                </Button>
            </Link>
          </div>
      </div>
      
      <FilterBar showSearch showTherapyFilters />

      <Card>
        <CardHeader>
          <CardTitle>Training Courses</CardTitle>
          <CardDescription>A list of all training materials in your system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingList.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.title}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {training.categoryIds.map(cat => <Badge key={cat} variant="outline">{cat}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{training.difficulty}</TableCell>
                  <TableCell>{training.durationMin} min</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={cn(
                        training.status === "published" && "bg-green-100 text-green-800",
                        training.status === "draft" && "bg-yellow-100 text-yellow-800",
                      )}
                      variant="secondary"
                    >
                      {training.status}
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
