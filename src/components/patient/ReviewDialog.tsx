'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { submitTherapistReviewAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function ReviewDialog({ appointmentId }: { appointmentId: string | number }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Rating required", description: "Please select a star rating.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const result = await submitTherapistReviewAction(appointmentId, { rating, review: reviewText });
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "Failed to submit review.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-blue-600 focus:text-blue-600">
          <Star className="mr-2 h-4 w-4" /> Leave Review
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Therapist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <Textarea 
            placeholder="Write your review here..." 
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
          />
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
