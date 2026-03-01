

import { SignupForm } from "./signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SocialSigninButtons } from "../signin/social-signin-buttons";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-var(--header-height))] py-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold font-headline">Create an Account</CardTitle>
                <CardDescription>
                    Join Curevan today to start your wellness journey.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <SocialSigninButtons />
                    <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>
                    <SignupForm />
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
                            Sign In
                        </Link>
                    </p>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Are you a therapist?{' '}
                        <Link href="/auth/therapist-signup" className="font-semibold text-primary hover:underline">
                            Register Here
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
