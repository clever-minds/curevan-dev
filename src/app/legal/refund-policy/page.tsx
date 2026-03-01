import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto py-12 md:py-20 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Refund, Cancellation & Return Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2023</p>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2023</p>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
            <p>At Himaya Care Pvt. Ltd., we strive to provide the best experience to our customers and patients. This policy outlines the terms for cancellations, refunds, and product returns related to therapy sessions, online consultations, and purchases made via the Curevan app or website.</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">SERVICE BOOKING CANCELLATIONS (THERAPY & CONSULTATION SESSIONS)</h2>
            <h3 className="font-semibold text-foreground">CANCELLATION BY CUSTOMER</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>You may cancel a booked session up to <strong>4 hours</strong> before the scheduled time without penalty.</li>
                <li>If you cancel within 4 hours of the appointment or fail to attend, no refund will be issued.</li>
                <li>Rescheduling is permitted once per session, subject to therapist availability.</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">CANCELLATION BY THERAPIST OR CLINIC</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>If the assigned therapist or clinic cancels, a 100% refund or free rescheduling will be offered.</li>
                <li>Refunds will be credited to your original payment method within 5–7 business days.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">REFUNDS FOR SESSIONS OR SERVICE FEES</h2>
             <p>Refunds are only processed for:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Cancellations initiated by the service provider</li>
                <li>System errors (e.g. double payment, technical failure)</li>
                <li>Therapist no-shows or refusal of service</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">Non-Refundable Cases:</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Services already rendered</li>
                <li>Patient dissatisfaction due to treatment outcome (clinical judgment)</li>
                <li>Late cancellation or no-show by customer</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">PRODUCT RETURN & REFUND POLICY (CUREVAN SHOP)</h2>
            <h3 className="font-semibold text-foreground">RETURN ELIGIBILITY</h3>
            <p>You can request a return for eligible items purchased from Curevan within <strong>7 calendar days</strong> of delivery if:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>The product is defective or damaged</li>
                <li>The wrong product was delivered</li>
                <li>The product is unused, in original packaging, with invoice</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">NON-RETURNABLE ITEMS</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Used or opened health kits</li>
                <li>Personal hygiene items (e.g. electrodes, compression garments)</li>
                <li>Custom or perishable items (e.g. gel packs, topical creams)</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">RETURN PROCESS</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Raise a return request via the Curevan App or customer support</li>
                <li>Upload photo/video proof if requested</li>
                <li>Once verified, pickup will be arranged</li>
                <li>Refunds will be issued within 7 working days post pickup</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">REFUND METHOD</h3>
            <p>Refunds will be credited using the same payment method used at checkout:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>UPI / Credit Card / Debit Card / Wallets</li>
                <li>For COD orders, bank details must be provided for transfer</li>
            </ul>
          </section>
          
           <section>
            <h2 className="text-xl font-semibold text-foreground">CONTACT US</h2>
            <p>If you have questions, concerns, or requests related to your privacy:</p>
            <address className="not-italic">
              Himaya Care Pvt. Ltd.<br/>
              Email: <a href="mailto:care@curevan.com" className="text-primary hover:underline">care@curevan.com</a><br/>
              Phone: +91 79 9060 2143<br/>
              Registered Address: Office 704, Time Square, Vasna - Bhayli Main Rd, Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012
            </address>
          </section>
          
           <section>
            <h2 className="text-xl font-semibold text-foreground">POLICY UPDATES</h2>
            <p>Curevan reserves the right to modify this policy from time to time. Updated terms will be posted on the app and website, and shall be effective from the date of posting.</p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
