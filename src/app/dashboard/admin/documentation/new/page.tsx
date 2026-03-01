
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewPostForm } from '@/app/dashboard/new-post/new-post-form';

export default function NewDocumentationPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Create New Document</h1>
        <p className="text-muted-foreground">Fill out the form below to create a new SOP or documentation.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <NewPostForm contentType="documentation" />
        </CardContent>
      </Card>
    </div>
  );
}
