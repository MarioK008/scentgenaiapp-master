import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#0E2A47]">
      {/* Navigation */}
      <nav className="bg-[#1C3B63]/80 backdrop-blur-sm border-b border-[#FF2E92]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/">
              <Logo variant="full" />
            </Link>
            <Link to="/">
              <Button variant="ghost" className="text-[#B0C4DE] hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 font-playfair">
          Privacy Policy
        </h1>
        
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-[#B0C4DE] text-lg mb-8">
            Last updated: January 5, 2025
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              1. Introduction
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              ScentGenAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our AI-powered 
              fragrance assistant service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-semibold text-white mb-3">Personal Information</h3>
            <p className="text-[#B0C4DE] leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-[#B0C4DE] space-y-2 mb-6">
              <li>Email address</li>
              <li>Username (optional)</li>
              <li>Profile information you choose to provide</li>
              <li>Profile picture (optional)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-white mb-3">Usage Information</h3>
            <p className="text-[#B0C4DE] leading-relaxed mb-4">
              We automatically collect:
            </p>
            <ul className="list-disc list-inside text-[#B0C4DE] space-y-2">
              <li>Your fragrance collection data</li>
              <li>Search queries and preferences</li>
              <li>Interaction with AI features</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              3. How We Use Your Information
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-[#B0C4DE] space-y-2">
              <li>Provide and improve our fragrance recommendation service</li>
              <li>Personalize your experience and AI interactions</li>
              <li>Send important service updates and notifications</li>
              <li>Analyze usage patterns to enhance features</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              4. AI and Data Processing
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              Our AI features process your fragrance preferences and queries to provide personalized recommendations. 
              This data is used to improve AI accuracy but is not shared with third parties for marketing purposes. 
              Conversations with our AI assistant may be analyzed to improve service quality.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              5. Data Sharing
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed mb-4">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside text-[#B0C4DE] space-y-2">
              <li>Service providers who help operate our platform</li>
              <li>AI service providers for processing queries (anonymized)</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              6. Data Security
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption 
              in transit and at rest, secure authentication, and regular security audits. However, no method 
              of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              7. Your Rights
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc list-inside text-[#B0C4DE] space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of certain data processing</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              8. Cookies and Tracking
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              We use essential cookies to maintain your session and preferences. We do not use third-party 
              tracking cookies for advertising. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              9. Data Retention
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. 
              Upon account deletion, your personal data will be removed within 30 days, except where required 
              by law to retain it longer.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              10. Children's Privacy
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              Our Service is not intended for children under 13. We do not knowingly collect personal 
              information from children. If you believe we have collected such information, please contact us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              11. Changes to This Policy
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              12. Contact Us
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              For privacy-related questions or requests, contact us at{" "}
              <a href="mailto:privacy@scentgenai.com" className="text-[#FF2E92] hover:underline">
                privacy@scentgenai.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1C3B63] border-t border-[#F7B731]/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#B0C4DE] text-sm">
            © 2025 ScentGenAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
