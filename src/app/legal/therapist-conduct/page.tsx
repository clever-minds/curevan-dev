import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TherapistConductPage() {
  return (
    <div className="container mx-auto py-12 md:py-20 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Therapist Code of Ethics & Professional Conduct</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2023</p>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2023</p>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
          <p>As a healthcare technology platform committed to safe, ethical, and professional physiotherapy services, Himaya Care Pvt. Ltd. outlines the following Code of Ethics and Conduct to be followed by all registered and affiliated therapists (including visiting, freelance, and clinic-based professionals).</p>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">PROFESSIONAL APPEARANCE & BRANDING</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Wear uniforms or Curevan-branded apparel, if provided, during all appointments.</li>
                <li>Maintain a neat, well-groomed, and professional appearance at all times.</li>
                <li>Carry valid ID or Curevan credentials if assigned.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">HYGIENE & TOOLS</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Always use clean, disinfected equipment for each patient.</li>
                <li>Disposable items (e.g., gloves, electrodes, face masks) must be used only once and discarded responsibly.</li>
                <li>Maintain a sanitized kit or treatment bag as part of daily preparation.</li>
                <li>Ensure that the therapy area (patient home or clinic) remains tidy and respectful of the environment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">INFORMED CONSENT & COMMUNICATION</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Always take verbal consent before initiating treatment.</li>
                <li>Explain the procedure, technique, and any equipment being used.</li>
                <li>Respect the patient’s right to refuse or stop any session at any point.</li>
                <li>Maintain polite, respectful, and culturally sensitive communication.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">PATIENT PRIVACY & CONFIDENTIALITY</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Never share patient details, history, or treatment notes outside the Curevan platform.</li>
                <li>All Patient Care Records (PCR) must be filled truthfully and securely.</li>
                <li>Avoid discussing a patient's health in public or non-professional settings.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">CLINICAL ETHICS & SCOPE</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Do not perform any procedures or suggest treatments beyond your licensed scope of practice.</li>
                <li>Avoid prescribing medication or making medical claims.</li>
                <li>If red flags or emergencies are observed, escalate to a Curevan support doctor or recommend hospital care.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">PUNCTUALITY & RELIABILITY</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Arrive on time for appointments.</li>
                <li>Mark availability status honestly in the app.</li>
                <li>Provide advance notice to Curevan if unavailable or unable to complete a scheduled visit.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">NON-SOLICITATION & PLATFORM INTEGRITY</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Do not solicit patients for private treatment outside the Curevan platform.</li>
                <li>Refrain from exchanging personal contact details with patients unless instructed for treatment continuity.</li>
                <li>Accept only appointments routed through Curevan systems (Zoho Bookings or Admin assignment).</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">MISCONDUCT, VIOLATIONS & DISCIPLINARY ACTION</h2>
            <p>Violation of this Code may result in:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Written warnings</li>
                <li>Suspension from the platform</li>
                <li>Permanent deactivation of your Curevan account</li>
                <li>Legal action, if applicable</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">SERVICE CHARGE DEDUCTIONS & REFUND RESPONSIBILITY</h2>
            <p>As a Curevan-affiliated therapist, you acknowledge and agree that Himaya Care Pvt. Ltd. reserves the right to debit service charges or adjust payouts under the following conditions:</p>
            <h3 className="font-semibold text-foreground">SCENARIOS THAT MAY LEAD TO DEDUCTIONS</h3>
            <p>Curevan may deduct part or full-service fees from your earnings if:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>You fail to attend a confirmed appointment without valid notice</li>
                <li>You arrive more than 20 minutes late without informing the patient or Curevan support</li>
                <li>The patient files a complaint and requests a refund due to:
                    <ul className='list-circle pl-6'>
                        <li>Rude or unprofessional behavior</li>
                        <li>Use of unclean or reused disposable tools</li>
                        <li>Incomplete or negligent treatment</li>
                        <li>Lack of verbal consent before therapy</li>
                    </ul>
                </li>
                <li>You cancel multiple bookings repeatedly after confirmation without alternate arrangement</li>
                <li>The PCR (Patient Care Record) is left incomplete or fabricated</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">REFUND TO PATIENTS</h3>
             <p>In the above cases, Curevan may:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Issue a partial or full refund to the affected customer</li>
                <li>Reflect the refunded amount as a deduction in your payout summary</li>
                <li>Temporarily pause your visibility or limit future appointments based on severity</li>
            </ul>
            <p>💡 <strong>Note:</strong> Each case will be reviewed by Curevan's internal quality and support team before any deduction is enforced.</p>

             <h3 className="font-semibold text-foreground mt-4">DISPUTE HANDLING</h3>
             <p>Therapists may raise a concern or dispute deduction decisions within 5 business days by contacting <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a>. Final decisions rest with Curevan administration after internal review.</p>

          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">ACKNOWLEDGEMENT</h2>
            <p>By accepting onboarding into the Curevan platform, you acknowledge:</p>
             <ul className="list-disc pl-6 space-y-2">
                <li>You have read and understood this Code of Ethics.</li>
                <li>You agree to comply with all professional conduct expectations.</li>
                <li>You understand the consequences of non-compliance.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">CONTACT US</h2>
            <p>If you have questions about business management:</p>
            <address className="not-italic">
              Himaya Care Pvt. Ltd.<br/>
              Email: <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a><br/>
              Phone: +91 79 9060 2143<br/>
              Registered Address: Office 704, Time Square, Vasna - Bhayli Main Rd, Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012
            </address>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
