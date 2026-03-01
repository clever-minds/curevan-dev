import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsOfUsePage() {
  return (
    <div className="container mx-auto py-12 md:py-20 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Terms of Use</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2023</p>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2023</p>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
          <p>Welcome to Curevan, a healthcare platform operated by Himaya Care Pvt. Ltd. (“Company”, “we”, “us”, or “our”). By using our mobile application, website, or associated services (“Platform”), you agree to comply with and be bound by these Terms of Use.</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">GENERAL TERMS (ALL USERS)</h2>
            <h3 className="font-semibold text-foreground">ACCEPTANCE OF TERMS</h3>
            <p>By accessing or using the Curevan Platform, you confirm that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are at least 18 years old (or using under guardian supervision)</li>
              <li>You understand and agree to these terms</li>
              <li>You consent to our <Link href="/legal/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/legal/medical-consent" className="text-primary hover:underline">Medical Consent Terms</Link></li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4">CHANGES TO TERMS</h3>
            <p>We may update these terms periodically. You will be notified of changes through the app or email. Continued use after such updates constitutes acceptance.</p>
            <h3 className="font-semibold text-foreground mt-4">ACCOUNT SECURITY</h3>
            <p>You are responsible for maintaining the confidentiality of your login credentials and any activity that occurs under your account.</p>
            <h3 className="font-semibold text-foreground mt-4">DATA USAGE</h3>
            <p>Use of the platform involves collecting and processing your data as described in our <Link href="/legal/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
            <h3 className="font-semibold text-foreground mt-4">PROHIBITED CONDUCT</h3>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Misrepresent your identity or provide false information</li>
                <li>Use the app for illegal, unethical, or unauthorized purposes</li>
                <li>Disrupt or interfere with system functionality or other users</li>
                <li>Upload viruses or malicious code</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">TERMS FOR CUSTOMERS / PATIENTS</h2>
             <p>These terms apply to users who book appointments, purchase products, or receive care via the app.</p>
            <h3 className="font-semibold text-foreground">MEDICAL DISCLAIMER</h3>
            <p>Curevan does not replace medical advice from your primary healthcare provider. Services are advisory and based on therapist assessment. Always consult your doctor for critical conditions.</p>
            <h3 className="font-semibold text-foreground mt-4">BOOKING APPOINTMENTS</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>You must provide accurate health information.</li>
                <li>Bookings may be auto-assigned based on therapist availability and location.</li>
                <li>Cancellation or rescheduling is allowed within defined timelines.</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4">TELECONSULTATION & CONSENT</h3>
            <p>By booking an online consultation, you consent to receive services virtually and acknowledge the limitations of telemedicine.</p>
            <h3 className="font-semibold text-foreground mt-4">PRODUCT PURCHASES</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>All items are sold under applicable warranty and return terms.</li>
                <li>Use only as directed or prescribed by a professional.</li>
                <li>Payment is required before shipment unless otherwise stated.</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">REFUNDS & CANCELLATIONS</h3>
            <p>Refunds are governed by our <Link href="/legal/refund-policy" className="text-primary hover:underline">Refund Policy</Link>. Sessions cancelled with less than 4 hours’ notice may be non-refundable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">TERMS FOR THERAPISTS & AFFILIATE CLINICS</h2>
            <p>These apply to professionals and facilities registered to provide services via the platform.</p>
             <h3 className="font-semibold text-foreground">PROFESSIONAL QUALIFICATIONS</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>You must be a licensed practitioner in your field.</li>
                <li>Curevan reserves the right to verify credentials and deny onboarding if not valid.</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">SERVICE DELIVERY</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Therapists must adhere to the agreed schedule and provide ethical, professional service.</li>
                <li>Affiliate clinics must ensure hygiene, safety, and staff conduct compliance.</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">SESSION DOCUMENTATION</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Therapists are required to complete a Patient Care Record (PCR) after each session.</li>
                <li>All data must be true, timely, and complete.</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">LOCATION SHARING CONSENT</h3>
            <p>If live tracking is enabled, you consent to share your location during service hours for nearby patient matching.</p>
             <h3 className="font-semibold text-foreground mt-4">PAYMENT TERMS</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Your earnings summary will be viewable via the app (Zoho Analytics).</li>
                <li>Payouts will be made as per monthly or milestone basis, net of platform fees.</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">CONDUCT & SUSPENSION</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Curevan may suspend access due to misconduct, repeated no-shows, or user complaints.</li>
                <li>You must not solicit patients outside the platform.</li>
            </ul>
          </section>
          
           <section>
            <h2 className="text-xl font-semibold text-foreground">PLATFORM SERVICE FEES (THERAPISTS & CLINICS)</h2>
            <p>Curevan reserves the right to deduct a platform service fee from the total consultation or session fees collected from customers. The current platform commission is 10%, and this may be revised upon prior notice. The payout summary displayed in your earnings dashboard will reflect the net amount payable to you after such deductions.</p>
          </section>
          
           <section>
            <h2 className="text-xl font-semibold text-foreground">LIABILITY & DISCLAIMERS</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Curevan is a technology platform connecting users and service providers.</li>
                <li>We are not liable for service outcomes, personal injury, or user disputes unless proven negligence occurs.</li>
                <li>The platform and all content are provided "as is", without warranties of any kind.</li>
            </ul>
            <p>You agree to indemnify, defend, and hold harmless Himaya Care Pvt. Ltd., its directors, officers, employees, agents, affiliates, and licensors from and against any and all claims, losses, damages, liabilities, costs, and expenses (including reasonable legal fees) arising from:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Your violation of these Terms;</li>
                <li>Any negligent, unethical, or unlawful act or omission by you;</li>
                <li>Your use or misuse of the Platform;</li>
                <li>Any breach of patient confidentiality, misdiagnosis, or malpractice (in the case of therapists or clinics).</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">GOVERNING LAW</h2>
            <p>In the event of any dispute arising between the user and Himaya Care Pvt. Ltd. in connection with the interpretation, validity, enforcement, or alleged breach of any provision of these Terms, both parties agree to first attempt an informal resolution.</p>
            <p>If the matter remains unresolved, the dispute shall be settled by binding arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English, seated in Vadodara, Gujarat, India, and governed by the laws of the India. The arbitral award shall be final and binding on both parties.</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
