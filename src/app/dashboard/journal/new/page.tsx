
'use client';

import { NewPostForm } from "@/app/dashboard/new-post/new-post-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewJournalPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Create New Journal Entry</h1>
        <p className="text-muted-foreground">Fill out the form below to share your expertise. It will be published after admin approval.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <NewPostForm contentType="post" />
        </CardContent>
      </Card>
    </div>
  );
}
