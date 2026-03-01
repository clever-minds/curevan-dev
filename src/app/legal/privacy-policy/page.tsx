import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 md:py-20 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2023</p>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2023</p>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
          <section>
            <h2 className="text-xl font-semibold text-foreground">INTRODUCTION</h2>
            <p>Himaya Care Pvt. Ltd. ("we", "our", or "us") is committed to protecting your personal data and ensuring transparency in how we collect, use, store, and share it. This Privacy Policy applies to all users of our mobile and web applications, including patients, customers, therapists, doctors, and clinic affiliates.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">SCOPE</h2>
            <p>This policy governs the collection and processing of data through:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Curevan mobile and web apps</li>
              <li>Third-party integrations (e.g., Zoho, Google Maps, Firebase)</li>
              <li>Booking, consultation, shopping, and communication services</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">DATA WE COLLECT</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>
                    <strong>Personal Identifiable Information (PII)</strong>
                    <ul className='list-circle pl-6'>
                        <li>Full name, phone number, email address</li>
                        <li>Date of birth, gender</li>
                        <li>Address and location (for home visits or service delivery)</li>
                    </ul>
                </li>
                <li>
                    <strong>Health-Related Information (for Customers)</strong>
                    <ul className='list-circle pl-6'>
                        <li>Medical history, symptoms, session notes</li>
                        <li>Uploaded reports, images, prescriptions</li>
                        <li>Consultation details and prescribed exercises</li>
                    </ul>
                </li>
                 <li>
                    <strong>Professional Information (for Therapists)</strong>
                     <ul className='list-circle pl-6'>
                        <li>Qualification, registration details, availability</li>
                        <li>Clinic/affiliate information, location-sharing data</li>
                    </ul>
                </li>
                 <li>
                    <strong>Transactional Data</strong>
                     <ul className='list-circle pl-6'>
                        <li>Booking history, consultation records, purchase history</li>
                        <li>Payment status and invoices</li>
                    </ul>
                </li>
                 <li>
                    <strong>Device & Usage Data</strong>
                     <ul className='list-circle pl-6'>
                        <li>App usage logs</li>
                        <li>IP address, browser/device type</li>
                        <li>Location data (if enabled)</li>
                    </ul>
                </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">HOW WE USE YOUR DATA</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Deliver personalized healthcare and physiotherapy services</li>
                <li>Enable appointment booking and consultation workflows</li>
                <li>Share health records securely between customers and therapists</li>
                <li>Provide location-based therapist matching</li>
                <li>Manage payments, orders, and refunds</li>
                <li>Improve user experience and app performance</li>
                <li>Comply with legal and regulatory obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">DATA SHARING & DISCLOSURE</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Authorized healthcare professionals (therapists, doctors)</li>
                <li>Third-party service providers (e.g., Zoho, payment gateways, couriers)</li>
                <li>Regulatory authorities, if required by law</li>
                <li>Internal staff for support, troubleshooting, and verification</li>
            </ul>
            <p>🔐 We do not sell or rent your personal data to any third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">YOUR RIGHTS</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Access and review your personal data</li>
                <li>Correct or update inaccurate information</li>
                <li>Withdraw consent at any time</li>
                <li>Request deletion of your data (subject to legal retention rules)</li>
                <li>Lodge a complaint with the Data Protection Authority</li>
            </ul>
            <p>Requests can be sent to <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a></p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">DATA RETENTION</h2>
            <p>We retain your data only as long as necessary:</p>
             <ul className="list-disc pl-6 space-y-2">
                <li>Medical records: As per regulatory norms</li>
                <li>Account-related data: Until account deletion or 3 years of inactivity</li>
                <li>Transactional data: As required by tax or accounting laws</li>
            </ul>
          </section>
          
           <section>
            <h2 className="text-xl font-semibold text-foreground">DATA SECURITY</h2>
            <p>We implement industry-standard practices including:</p>
             <ul className="list-disc pl-6 space-y-2">
                <li>SSL encryption</li>
                <li>Role-based access controls</li>
                <li>Secure cloud storage</li>
                <li>Regular audits and system monitoring</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">THIRD-PARTY SERVICES</h2>
            <p>We integrate with trusted third-party platforms including:</p>
             <ul className="list-disc pl-6 space-y-2">
                <li>Zoho (Creator, Commerce, Bookings, Analytics)</li>
                <li>Google Maps API</li>
                <li>Firebase Authentication & Notifications</li>
            </ul>
            <p>Each service follows its own privacy policy. We ensure secure API-based communication and audit logs.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">CHILDREN’S PRIVACY</h2>
            <p>Our services are not intended for individuals under 18 without parental or legal guardian consent. We do not knowingly collect personal data from minors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">CONTACT US</h2>
            <p>If you have questions, concerns, or requests related to your privacy:</p>
            <address className="not-italic">
              Himaya Care Pvt. Ltd.<br/>
              Email: <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a><br/>
              Phone: +91 79 9060 2143<br/>
              Registered Address: Office 704, Time Square, Vasna - Bhayli Main Rd, Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012<br/>
              <br/>
              <strong>Data Protection Officer (DPO):</strong><br/>
              Name: Rafia Malek<br/>
              Email: <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a>
            </address>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">GOVERNING LAW</h2>
             <p>We may update this policy from time to time. Users will be notified via in-app notification or email. Continued use of the app after changes constitutes acceptance of the revised policy.</p>
            <p>This Privacy Policy shall be governed by and interpreted in accordance with the laws of the India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Vadodara, Gujarat, India.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
