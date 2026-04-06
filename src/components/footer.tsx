

'use client';

import Link from 'next/link';
import LogoLight from './logo-light';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';

const newsletterSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

const footerLinks = {
  "Services & Company": [
    { href: '/discover', label: 'Book a Session' },
    { href: '/therapists', label: 'Find a Therapist' },
    { href: '/ecommerce', label: 'Shop Products' },
    { href: '/about', label: 'Our Story' },
    { href: '/contact', label: 'Contact Us' },
  ],
  "Policies": [
    { href: '/legal/terms-of-use', label: 'Terms of Use' },
    { href: '/legal/medical-consent', label: 'Medical Consent' },
    { href: '/legal/privacy-policy', label: 'Privacy Policy' },
    { href: '/legal/refund-policy', label: 'Refund Policy' },
    { href: '/legal/marketing-consent', label: 'Marketing Consent' },
    { href: '/legal/cookie-policy', label: 'Cookie Policy' },
    { href: '/legal/therapist-conduct', label: 'Therapist Conduct' },
  ]
};

const XLogo = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931L18.901 1.153zm-1.61 19.932h2.5l-10.8-12.076H7.13l10.16 12.076z" />
  </svg>
);

export default function Footer() {
  const { toast } = useToast();

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' }
  });

  const handleSubscribe = (data: NewsletterFormValues) => {
    // In a real app, this would be a server action.
    console.log('Subscribing email:', data.email);
    toast({
      title: 'Subscription Pending',
      description: 'Please check your email to confirm your subscription.',
    });
    form.reset();
  };

  return (
    <footer className="bg-footer-gradient text-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 py-12 relative z-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <LogoLight />
            <p className="text-white/80 max-w-sm">
              Curevan offers professional therapy services and quality wellness products delivered right to your door. Cure. Anywhere.
            </p>
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Subscribe to our newsletter</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubscribe)} className="space-y-4">
                  <div className="flex flex-col sm:flex-row w-full max-w-sm items-stretch sm:items-start gap-3 sm:gap-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input type="email" placeholder="Email" className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 focus:ring-white/50 h-10" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="secondary" className="bg-white/90 text-primary hover:bg-white h-10 whitespace-nowrap">Subscribe</Button>
                  </div>
                  <FormMessage className="text-destructive text-xs">{form.formState.errors.email?.message}</FormMessage>
                </form>
              </Form>
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="font-bold mb-4">{title}</h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-white/80 hover:text-white transition-colors text-sm">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-white/70 text-center md:text-left">
              <p>Copyright © {new Date().getFullYear()} Himaya Care Pvt. Ltd. All Rights Reserved.</p>
            </div>
            <div className="flex gap-4">
              <Link href="#" aria-label="Follow us on Facebook" className="text-white/80 hover:text-white"><Facebook className="w-5 h-5" /></Link>
              <Link href="#" aria-label="Follow us on X" className="text-white/80 hover:text-white"><XLogo /></Link>
              <Link href="#" aria-label="Follow us on Instagram" className="text-white/80 hover:text-white"><Instagram className="w-5 h-5" /></Link>
              <Link href="#" aria-label="Follow us on LinkedIn" className="text-white/80 hover:text-white"><Linkedin className="w-5 h-5" /></Link>
              <Link href="#" aria-label="Subscribe to our YouTube channel" className="text-white/80 hover:text-white"><Youtube className="w-5 h-5" /></Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
