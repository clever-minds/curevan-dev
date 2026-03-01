'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsentForm } from '@/components/consent-form';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function MarketingConsentPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-12 md:py-20 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Marketing & Communication Consent Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2023</p>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2023</p>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
          <p>At Himaya Care Pvt. Ltd., we value your privacy and want to ensure you are in control of how and when you receive communications from us. This Marketing & Communication Consent Policy outlines your rights and choices regarding promotional messages, alerts, and updates.</p>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">PURPOSE OF COMMUNICATION</h2>
            <p>With your consent, we may send you messages that include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Health tips, wellness offers, and product promotions</li>
              <li>Appointment or treatment reminders</li>
              <li>Announcements about new features, services, or clinics</li>
              <li>Personalized recommendations and special discounts</li>
            </ul>
            <p>These communications may be delivered via:</p>
             <ul className="list-disc pl-6 space-y-2">
              <li>Email</li>
              <li>SMS</li>
              <li>WhatsApp</li>
              <li>In-app notifications</li>
              <li>Push notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">CONSENT COLLECTION</h2>
            <p>Your consent is optional and is requested through a checkbox or toggle during:</p>
             <ul className="list-disc pl-6 space-y-2">
              <li>Sign-up or onboarding</li>
              <li>Profile preferences</li>
              <li>Checkout or booking process</li>
            </ul>
            <p><strong>Example Checkbox (Customer Sign-Up):</strong><br />“I agree to receive updates, health offers, and promotional communication from Curevan via SMS, email, or WhatsApp.”</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">RIGHT TO WITHDRAW CONSENT</h2>
            <p>You can opt out of receiving promotional communication at any time by:</p>
             <ul className="list-disc pl-6 space-y-2">
              <li>Clicking the “Unsubscribe” link in emails</li>
              <li>Messaging STOP via SMS or WhatsApp channel</li>
              <li>Contacting support at <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a></li>
            </ul>
             <p><strong>Note:</strong> Service-related alerts (e.g., booking confirmations, order updates) will still be sent, even if you opt out of marketing messages.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">DATA USE FOR COMMUNICATION</h2>
            <p>We use your basic contact information (name, phone, email) to send messages securely. All communications are sent via encrypted or authorized gateways to protect your data.</p>
            <p>We may also use anonymized data to personalize your offers and improve campaign effectiveness. No health data is used for marketing without explicit consent.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">THIRD-PARTY MARKETING TOOLS</h2>
            <p>To manage and send communications, we may use tools such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Integrated Campaigns API</li>
              <li>WhatsApp Business API</li>
              <li>Firebase Cloud Messaging</li>
            </ul>
            <p>Each service is bound by data protection agreements and secure protocols.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">POLICY UPDATES</h2>
            <p>We may revise this consent policy as our services evolve. Any changes will be notified through email or app. Continued use of our services after updates implies agreement to the revised terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">CONTACT US</h2>
            <p>For opt-out requests, issues, or concerns:</p>
            <address className="not-italic">
              Himaya Care Pvt. Ltd.<br />
              Email: <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a><br />
              Phone: +91 79 9060 2143<br />
              Registered Address: Office 704, Time Square, Vasna - Bhayli Main Rd, Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012
            </address>
          </section>
          
          {/* New Interactive Section */}
          <section>
             <h2 className="text-2xl font-bold font-headline text-foreground">Record Your Consent</h2>
             {user ? (
                <ConsentForm consentType="marketing" version="1.0" />
             ) : (
                <div className="p-4 border rounded-lg bg-secondary/50 text-center">
                    <p className="mb-4">Please <Link href="/auth/signin" className="text-primary font-bold hover:underline">sign in</Link> to record your consent preferences.</p>
                </div>
             )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
