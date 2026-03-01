
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SupportFeedbackForm } from "@/components/support-feedback-form";

export default function SupportPage() {
  return (
    <div className="container mx-auto py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          Support Center
        </h1>
        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
          Need help? Fill out the form below to create a support ticket, or check our <Link href="/faq" className="text-primary hover:underline">FAQ page</Link> for common questions.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create a Support Ticket</CardTitle>
            <CardDescription>
              Our support team will get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupportFeedbackForm formType="support" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
