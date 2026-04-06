'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Plus, Loader2, User, Calendar, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  fetchProductReviews, 
  addReview, 
  deleteReview, 
  updateReview 
} from '@/lib/repos/reviews';
import { Review } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ProductReviewsProps {
  productId: number;
  initialRating?: number;
}

export default function ProductReviews({ productId, initialRating = 0 }: ProductReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProductReviews(productId);
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to leave a review.',
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      toast({
        variant: 'destructive',
        title: 'Invalid Rating',
        description: 'Please select a rating between 1 and 5 stars.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingReviewId) {
        const res = await updateReview(editingReviewId, { rating, comment });
        if (res.success) {
          toast({ title: 'Review Updated', description: 'Your review has been successfully updated.' });
          setEditingReviewId(null);
          setShowForm(false);
          loadReviews();
        } else {
          toast({ variant: 'destructive', title: 'Update Failed', description: res.message });
        }
      } else {
        const res = await addReview({ productId, rating, comment });
        if (res.success) {
          toast({ title: 'Review Added', description: 'Thank you for your feedback!' });
          setShowForm(false);
          setComment('');
          setRating(5);
          loadReviews();
        } else {
          toast({ variant: 'destructive', title: 'Submission Failed', description: res.message });
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const res = await deleteReview(id);
      if (res.success) {
        toast({ title: 'Review Deleted', description: 'Your review has been removed.' });
        loadReviews();
      } else {
        toast({ variant: 'destructive', title: 'Delete Failed', description: res.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment);
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: document.getElementById('review-form')?.offsetTop ? document.getElementById('review-form')!.offsetTop - 100 : 0, behavior: 'smooth' });
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : initialRating > 0 ? initialRating.toFixed(1) : '0.0';

  const userHasReviewed = user && reviews.some(r => {
    const reviewId = String(r.userId);
    const userId = String(user.id);
    const userUid = user.uid ? String(user.uid) : null;
    
    return reviewId === userId || (userUid && reviewId === userUid);
  });

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  if (loading && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12" id="product-reviews">
      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Col: Rating Summary & Breakdown */}
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">Customer Ratings</h3>
            <div className="flex items-center gap-4">
              <span className="text-5xl font-bold">{averageRating}</span>
              <div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-5 h-5 ${Number(averageRating) >= star ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground/30'}`} 
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{reviews.length} total reviews</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {ratingCounts.map((rc) => (
              <div key={rc.stars} className="flex items-center gap-4 group cursor-default">
                <span className="text-sm font-bold w-12 shrink-0">{rc.stars} Stars</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all duration-1000 group-hover:bg-yellow-400" 
                    style={{ width: `${rc.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-10 text-right">{Math.round(rc.percentage)}%</span>
              </div>
            ))}
          </div>

          {!userHasReviewed && !showForm && (
            <div className="pt-4">
              <div className="p-6 rounded-2xl bg-muted/30 border border-dashed text-center space-y-4">
                <p className="font-bold">Review this product</p>
                <p className="text-sm text-muted-foreground">Share your thoughts with other customers</p>
                <Button onClick={() => setShowForm(true)} className="w-full rounded-xl shadow-lg shadow-primary/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Write a Review
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Reviews List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold font-headline flex items-center gap-2">
              Reviews
              <Badge variant="secondary" className="ml-2">{reviews.length}</Badge>
            </h3>
          </div>

          {showForm && (
            <Card className="border-primary/20 bg-primary/5 shadow-sm" id="review-form">
              <CardHeader>
                <CardTitle>{editingReviewId ? 'Edit Your Review' : 'Share Your Thoughts'}</CardTitle>
                <CardDescription>How was your experience with this product?</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform active:scale-90"
                        >
                          <Star 
                            className={`w-8 h-8 ${rating >= star ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground/30 hover:text-yellow-500/50'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Feedback</label>
                    <Textarea 
                      placeholder="What did you like or dislike? How are you using this product?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] rounded-xl border-primary/10 focus:border-primary/50"
                      required
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setShowForm(false);
                        setEditingReviewId(null);
                        setComment('');
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="rounded-xl min-w-[120px]">
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        editingReviewId ? 'Update Review' : 'Post Review'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h4 className="text-xl font-bold">No reviews yet</h4>
                <p className="text-muted-foreground">Be the first to share your experience with this product!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="border-none shadow-none bg-muted/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{review.userName || 'Verified Buyer'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {review.createdAt ? format(new Date(review.createdAt), 'MMM dd, yyyy') : 'Recently'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${review.rating >= star ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground/20'}`} 
                        />
                      ))}
                    </div>
                    {user?.id === Number(review.userId) && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(review)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(review.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
