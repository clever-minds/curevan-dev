
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewPostForm } from '@/app/dashboard/new-post/new-post-form';
import { useParams } from "next/navigation";

export default function NewDocumentationPage() {
    const params = useParams();
    const id = params?.id as string;
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Update Document</h1>
        <p className="text-muted-foreground">Fill out the form below to create a new SOP or documentation.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <NewPostForm contentType="documentation" postId={Number(id)}/>
        </CardContent>
      </Card>
    </div>
  );
}
