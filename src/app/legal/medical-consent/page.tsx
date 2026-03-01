import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MedicalConsentPage() {
  return (
    <div className="container mx-auto py-12 md:py-20 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Medical Consent Terms</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2023</p>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2023</p>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
          <p>This Medical Consent Agreement (“Consent”) is entered into by the user ("you" or "the patient") and Himaya Care Pvt. Ltd. (“Curevan”, “we”, “our”, or “us”) in connection with the use of our healthcare services via mobile/web platforms, including therapy sessions, virtual consultations, and digital health records.</p>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">PURPOSE OF CONSENT</h2>
            <p>By accepting this Consent, you authorize Himaya Care Pvt. Ltd. and its affiliated professionals (therapists, support doctors, clinics) to collect, store, access, and use your medical information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Assess and deliver treatment services</li>
              <li>Record health conditions, diagnoses, and progress</li>
              <li>Share relevant data with licensed practitioners assigned to your care</li>
              <li>Improve clinical outcomes and personalize services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">WHAT YOU CONSENT TO</h2>
            <p>You explicitly agree to the following:</p>
            <h3 className="font-semibold text-foreground">COLLECTION & STORAGE OF MEDICAL DATA</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Health complaints, pain areas, treatment goals</li>
              <li>Patient Care Records (PCRs), session notes, prescriptions</li>
              <li>Medical images, uploaded files, test results</li>
              <li>Past or current medications (if disclosed)</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4">USE OF DATA</h3>
            <ul className="list-disc pl-6 space-y-2">
                <li>Delivering home visits or online consultations</li>
                <li>Enabling treatment history access for assigned therapists</li>
                <li>Analytics, performance improvement, and anonymized health trend reports</li>
            </ul>
             <h3 className="font-semibold text-foreground mt-4">SHARING WITH AUTHORIZED PARTIES</h3>
             <p>Your data may be shared only with:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Assigned therapists and support doctors</li>
                <li>Internal support staff (under confidentiality obligations)</li>
                <li>Software Developer (under confidentiality obligations) and secure cloud partners</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">TELECONSULTATION CONSENT</h2>
            <p>If you opt for online therapy or doctor consultations, you acknowledge:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are voluntarily receiving care remotely via video/audio platform</li>
              <li>Remote consultations have limitations vs. physical assessments</li>
              <li>Curevan and its therapists are not liable for conditions requiring in-person diagnosis</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">RIGHT TO WITHDRAW CONSENT</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>You may withdraw this consent at any time by contacting <a href="mailto:privacy@curevan.com" className="text-primary hover:underline">privacy@curevan.com</a> or through the app's account settings.</li>
                <li>Withdrawing consent may limit or disable certain services (e.g. bookings, records).</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">RETENTION OF HEALTH RECORDS</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Records will be securely retained for a minimum of 3 years or as per applicable health regulations, whichever is longer.</li>
                <li>You may request a copy or deletion of your records, subject to legal limits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">DATA PROTECTION & SECURITY</h2>
            <p>Curevan implements industry-standard encryption and access control measures. Only verified personnel and medical professionals can access your sensitive health data.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">BY ACCEPTING THIS CONSENT:</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>You confirm that you understand the scope of this medical data usage.</li>
                <li>You are providing informed consent voluntarily.</li>
                <li>You are aware of your rights under the [Privacy Policy] and the [Terms of Use].</li>
            </ul>
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
