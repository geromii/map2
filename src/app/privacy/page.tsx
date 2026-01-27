import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Mapdis",
  description: "Privacy Policy for Mapdis - Global Relations Map",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: January 27, 2026</p>

        <div className="prose prose-slate max-w-none">
          <p>
            Mapdis (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website mapdis.com (the &quot;Service&quot;).
            This page informs you of our policies regarding the collection, use, and disclosure of personal
            information when you use our Service.
          </p>

          <h2>Information We Collect</h2>

          <h3>Account Information</h3>
          <p>
            When you create an account, we collect information you provide directly, including:
          </p>
          <ul>
            <li>Email address</li>
            <li>Name (if provided via Google sign-in)</li>
            <li>Profile picture (if provided via Google sign-in)</li>
          </ul>

          <h3>Usage Data</h3>
          <p>
            We collect anonymous usage data to improve our Service, including:
          </p>
          <ul>
            <li>Countries you interact with on the map (aggregated, not linked to your identity)</li>
            <li>Session information (number of interactions per visit)</li>
            <li>Pages visited and features used</li>
          </ul>

          <h3>Payment Information</h3>
          <p>
            If you subscribe to a paid plan, payment processing is handled by Stripe. We do not store
            your credit card information on our servers. We only receive and store:
          </p>
          <ul>
            <li>Subscription status</li>
            <li>Plan type</li>
            <li>Billing period information</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Service</li>
            <li>Process transactions and manage subscriptions</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
          </ul>

          <h2>Information Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share
            information only in the following circumstances:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> We use third-party services (Stripe for payments,
            Google for authentication, Convex for data storage) that may process your data on our behalf.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or
            in response to valid legal requests.</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
            assets, your information may be transferred.</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the Internet or electronic storage
            is 100% secure.
          </p>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of marketing communications</li>
          </ul>
          <p>
            To exercise these rights, please contact us at privacy@mapdis.com or use the account
            deletion feature in your account settings.
          </p>

          <h2>Cookies</h2>
          <p>
            We use essential cookies and local storage to maintain your session and preferences.
            We do not use third-party tracking cookies for advertising purposes.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Our Service is not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If you become aware that a child has provided us
            with personal information, please contact us.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at privacy@mapdis.com.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
