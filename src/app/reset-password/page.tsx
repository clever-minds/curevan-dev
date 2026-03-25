
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-var(--header-height))] py-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold font-headline">Reset Your Password</CardTitle>
                <CardDescription>
                    {token 
                        ? "Enter and confirm your new password below." 
                        : "Invalid or missing reset token. Please check your email for the correct link."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {token ? (
                    <ResetPasswordForm token={token} />
                ) : (
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/auth/forgot-password">
                            Request New Link
                        </Link>
                    </Button>
                )}
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
