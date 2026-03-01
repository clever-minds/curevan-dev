
import { TherapistOnboardingForm } from "./therapist-onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TherapistSignupPage() {
  return (
    <div className="container mx-auto py-12">
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold font-headline">Therapist Onboarding</CardTitle>
                <CardDescription>
                    Join our network of trusted healthcare professionals.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TherapistOnboardingForm />
                 <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
                        Sign In
                    </Link>
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
