
import { SigninForm } from "./signin-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SocialSigninButtons } from "./social-signin-buttons";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { DebugLoginButtons } from "./debug-login-buttons";

export default function SigninPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-var(--header-height))] py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold font-headline">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to your Curevan account to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* <DebugLoginButtons /> */}
                    <Separator />
                    <SocialSigninButtons />
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/phone-signin">
                            <Phone className="mr-2" />
                            Continue with Phone
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>
                    <SigninForm />
                    <p className="text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
