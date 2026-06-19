'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { listAppointmentsForUser } from "@/lib/repos/appointments";
import { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare } from "lucide-react";

export default function TherapistReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      if (!user) return;
      try {
        const appts = await listAppointmentsForUser(user.id, 'therapist');
        // Filter appointments that have a rating or review
        const withReviews = appts.filter(a => a.rating != null || (a.review && a.review.trim() !== ''));
        setReviews(withReviews);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [user]);

  if (loading) return <Skeleton className="w-full h-[600px]" />;

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ratings & Reviews</h1>
        <p className="text-muted-foreground">See what your patients are saying about your sessions.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
            <h2 className="text-4xl font-bold">{avgRating}</h2>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-blue-500" />
            <h2 className="text-4xl font-bold">{reviews.length}</h2>
            <p className="text-sm text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              You don't have any reviews yet. Keep providing great service!
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{review.patientName}</CardTitle>
                    <CardDescription>{new Date(review.date).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-yellow-700">{review.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 italic">
                  "{review.review || 'No written feedback provided.'}"
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
