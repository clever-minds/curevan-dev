
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewPostForm } from '@/app/dashboard/new-post/new-post-form';

export default function NewTrainingPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Create New Training</h1>
        <p className="text-muted-foreground">Fill out the form below to create a new training course.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <NewPostForm contentType="training" />
        </CardContent>
      </Card>
    </div>
  );
}
