
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto py-12 md:py-20 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Cookie & Analytics Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2023</p>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2023</p>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
          <p>This Cookie & Analytics Policy explains how Himaya Care Pvt. Ltd. (“we”, “our”, “Curevan”) uses cookies and similar technologies to recognize you when you visit our website or use our web-based platform. It also describes your rights to control our use of them.</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">WHAT ARE COOKIES?</h2>
            <p>Cookies are small text files stored on your device (computer, smartphone, tablet) when you visit a website. They help websites remember your preferences, improve functionality, and understand usage behavior.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">TYPES OF COOKIES WE USE</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="font-semibold text-foreground p-2">Type</th>
                  <th className="font-semibold text-foreground p-2">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 align-top"><strong>Essential Cookies</strong></td>
                  <td className="p-2">Required for the basic operation of our platform (e.g., login, navigation)</td>
                </tr>
                <tr>
                  <td className="p-2 align-top"><strong>Functional Cookies</strong></td>
                  <td className="p-2">Remember your preferences (e.g., location, language)</td>
                </tr>
                <tr>
                  <td className="p-2 align-top"><strong>Analytics Cookies</strong></td>
                  <td className="p-2">Help us understand user behavior and app performance (e.g., Zoho, Google)</td>
                </tr>
                <tr>
                  <td className="p-2 align-top"><strong>Marketing Cookies</strong></td>
                  <td className="p-2">Optional. Used for personalized promotions and retargeting ads (if enabled)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">ANALYTICS TOOLS USED</h2>
            <p>We use the following services to analyze traffic and improve user experience:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Analytics:</strong> Tracks usage patterns, session duration, pages visited, device/browser type.</li>
              <li><strong>Zoho Analytics:</strong> Tracks app/module engagement, operational KPIs.</li>
              <li><strong>Firebase (Google):</strong> Used for app crash reports, user behavior, and notification delivery.</li>
            </ul>
            <p>These tools may collect anonymized IP addresses and device IDs, but never your name, contact, or medical data.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">CONSENT & CONTROL</h2>
            <p>When you visit our website or web app, you’ll see a cookie banner that allows you to:</p>
             <ul className="list-disc pl-6 space-y-2">
                <li>Accept all cookies</li>
                <li>Customize your cookie preferences</li>
                <li>Reject non-essential cookies</li>
            </ul>
            <p>⚠️ By continuing to browse without changing your preferences, you consent to our use of cookies as outlined in this policy.</p>
            <p>You can also manage cookies via:</p>
             <ul className="list-disc pl-6 space-y-2">
                <li>Your browser settings (clear, block, or disable cookies)</li>
                <li>Cookie control options in our app settings (if supported)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">THIRD-PARTY COOKIES</h2>
            <p>Some cookies may be set by third-party services integrated into our platform (e.g., embedded maps, video players, analytics tools). These are governed by their respective policies.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground">DATA PRIVACY</h2>
            <p>All cookie-related data is handled in compliance with our [Privacy Policy]. We do not use cookies to collect sensitive personal or health-related information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">POLICY UPDATES</h2>
            <p>We may update this Cookie Policy as our analytics stack or technology evolves. Any updates will be reflected on this page and dated accordingly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">CONTACT US</h2>
            <p>If you have questions about how we use cookies or how to manage them:</p>
            <address className="not-italic">
              Himaya Care Pvt. Ltd.<br/>
              Email: <a href="mailto:cc@curevan.com" className="text-primary hover:underline">cc@curevan.com</a><br/>
              Phone: +91 79 9060 2143<br/>
              Registered Address: Office 704, Time Square, Vasna - Bhayli Main Rd, Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012
            </address>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
