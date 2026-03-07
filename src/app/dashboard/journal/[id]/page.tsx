'use client';

import { useParams } from "next/navigation";
import { NewPostForm } from "@/app/dashboard/new-post/new-post-form";
import { Card, CardContent } from '@/components/ui/card';
interface NewPostFormProps {
  contentType: "post";
  postId?: string;
}
export default function NewJournalPage() {

  const params = useParams();
  const id = params.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Update Journal Entry
        </h1>
        <p className="text-muted-foreground">
          Fill out the form below to share your expertise. It will be published after admin approval.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <NewPostForm contentType="post" postId={id} />
        </CardContent>
      </Card>
    </div>
  );
}