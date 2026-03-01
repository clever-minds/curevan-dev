
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-var(--header-height))] py-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold font-headline">Forgot Your Password?</CardTitle>
                <CardDescription>
                    No problem. Enter your email below and we'll send you a link to reset it.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ForgotPasswordForm />
                <Button variant="link" asChild className="w-full">
                    <Link href="/auth/signin">
                        <ArrowLeft className="mr-2" />
                        Back to Sign In
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
