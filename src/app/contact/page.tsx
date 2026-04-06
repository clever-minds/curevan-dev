'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send, Building, FileText, Fingerprint } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { submitContactUsAction } from "@/lib/actions";
import { useTransition, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/lib/firebase";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email(),
  subject: z.string().min(1, "Subject is required."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    }
  });

  useEffect(() => {
    if (!auth || recaptchaVerifierRef.current) return;

    // Initialize reCAPTCHA on component mount
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
      recaptchaVerifierRef.current.render();
    } catch (error) {
      console.error("Error creating reCAPTCHA verifier on contact page", error);
    }

    // Cleanup on unmount
    return () => {
      recaptchaVerifierRef.current?.clear();
    };
  }, [auth]);


  const onSubmit = (data: ContactFormValues) => {
    startTransition(async () => {
      const result = await submitContactUsAction(data);
      if (result.success) {
        toast({
          title: "Message Sent!",
          description: "Thank you for contacting us. Our team will get back to you shortly.",
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: (result as any).message || result.error || "An unexpected error occurred.",
        });
      }
    });
  }

  return (
    <main className="container mx-auto py-12 md:py-20">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl">
          Get in Touch with Curevan
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Have a question or need assistance? We're here to help.
        </p>
      </section>

      <section>
        <Card>
          <div className="grid md:grid-cols-2">
            {/* Contact Form */}
            <div className="p-8">
              <h2 className="text-2xl font-bold font-headline mb-2">Send us a Message</h2>
              <p className="text-muted-foreground mb-6">Our team will get back to you within 24 hours.</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Your Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="email" control={form.control} render={({ field }) => (<FormItem><FormLabel>Your Email</FormLabel><FormControl><Input placeholder="Your Email" type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField name="subject" control={form.control} render={({ field }) => (<FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="Subject" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="message" control={form.control} render={({ field }) => (<FormItem><FormLabel>Your Message</FormLabel><FormControl><Textarea placeholder="Your message..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div id="recaptcha-container"></div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                    Send Message
                  </Button>
                </form>
              </Form>
            </div>

            {/* Contact Information */}
            <div className="p-8 bg-muted/30 rounded-r-lg">
              <h2 className="text-2xl font-bold font-headline mb-6">Contact Information</h2>
              <div className="space-y-6 text-muted-foreground">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Our Address</h3>
                    <p>Himaya Care Pvt. Ltd.</p>
                    <p>Office 704, Time Square, Vasna - Bhayli Main Rd,</p>
                    <p>Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <a href="mailto:care@curevan.com" className="hover:underline">care@curevan.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Phone</h3>
                    <a href="tel:+917990602143" className="hover:underline">+91 79 9060 2143</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Corporate Identity Number (CIN)</h3>
                    <p>U86909GJ2025PTC166195</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Fingerprint className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Goods and Services Tax ID (GSTIN)</h3>
                    <p>24AAICH1171N1ZG</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
