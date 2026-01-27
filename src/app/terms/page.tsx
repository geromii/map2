import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Mapdis",
  description: "Terms of Service for Mapdis - Global Relations Map",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Last updated: January 27, 2026</p>

        <div className="prose prose-slate max-w-none">
          <p>
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using the Mapdis website
            at mapdis.com (the &quot;Service&quot;) operated by Mapdis (&quot;us,&quot; &quot;we,&quot; or &quot;our&quot;).
          </p>

          <h2>Acceptance of Terms</h2>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you disagree
            with any part of the terms, you may not access the Service.
          </p>

          <h2>Description of Service</h2>
          <p>
            Mapdis is an interactive visualization tool that displays global diplomatic relationships,
            geopolitical data, and AI-generated scenarios. The Service includes:
          </p>
          <ul>
            <li>Interactive world maps showing country relationships</li>
            <li>AI-generated geopolitical scenarios and predictions</li>
            <li>Daily headlines and analysis</li>
            <li>Custom scenario generation (for registered users)</li>
          </ul>

          <h2>User Accounts</h2>
          <p>
            Some features of the Service require you to create an account. When you create an account, you agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>

          <h2>Subscriptions and Payments</h2>
          <p>
            Some features of the Service are available through paid subscriptions. By subscribing, you agree to:
          </p>
          <ul>
            <li>Pay all fees associated with your subscription plan</li>
            <li>Provide accurate billing information</li>
            <li>Accept automatic renewal unless you cancel before the renewal date</li>
          </ul>
          <p>
            Subscription fees are non-refundable except as required by law. You may cancel your
            subscription at any time through your account settings, and you will retain access
            until the end of your current billing period.
          </p>

          <h2>Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the rights of others</li>
            <li>Distribute malware or engage in harmful activities</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Misrepresent your identity or affiliation</li>
          </ul>

          <h2>AI-Generated Content</h2>
          <p>
            The Service uses artificial intelligence to generate scenarios, predictions, and analysis.
            You acknowledge and agree that:
          </p>
          <ul>
            <li>AI-generated content is for informational and entertainment purposes only</li>
            <li>Predictions and scenarios do not constitute professional advice</li>
            <li>AI-generated content may contain inaccuracies or biases</li>
            <li>You should not rely solely on AI-generated content for important decisions</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by Mapdis
            and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You retain ownership of any content you create using the Service, but grant us a license
            to use, display, and store that content as necessary to provide the Service.
          </p>

          <h2>Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
            either express or implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, secure, or error-free,
            or that any defects will be corrected.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Mapdis shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits or
            revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill,
            or other intangible losses resulting from:
          </p>
          <ul>
            <li>Your use or inability to use the Service</li>
            <li>Any unauthorized access to or use of our servers</li>
            <li>Any interruption or cessation of transmission to or from the Service</li>
            <li>Any bugs, viruses, or other harmful code transmitted through the Service</li>
            <li>Any errors or omissions in any content</li>
          </ul>

          <h2>Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Mapdis and its officers, directors, employees,
            and agents from any claims, damages, losses, liabilities, and expenses arising out of
            your use of the Service or violation of these Terms.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of
            significant changes by posting the new Terms on this page and updating the &quot;Last updated&quot;
            date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>

          <h2>Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately, without prior notice,
            for any reason, including breach of these Terms. Upon termination, your right to use
            the Service will immediately cease.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            United States, without regard to its conflict of law provisions.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at legal@mapdis.com.
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
