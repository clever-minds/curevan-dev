'use client';

import { useParams } from "next/navigation";
import { Card, CardContent } from '@/components/ui/card';
import { NewPostForm } from '@/app/dashboard/new-post/new-post-form';

export default function NewTrainingPage() {

  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Update Training
        </h1>
        <p className="text-muted-foreground">
          Fill out the form below to update the training course.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <NewPostForm contentType="training" postId={Number(id)} />
        </CardContent>
      </Card>
    </div>
  );
}