import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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
          Terms of Service
        </h1>
        
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-[#B0C4DE] text-lg mb-8">
            Last updated: January 5, 2025
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              1. Acceptance of Terms
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              By accessing or using ScentGenAI ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              2. Description of Service
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              ScentGenAI is an AI-powered fragrance assistant that helps users organize their perfume collections, 
              discover new scents, and understand fragrances through intelligent recommendations. The Service 
              includes features such as collection management, AI chat assistance, and personalized recommendations.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              3. User Accounts
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-[#B0C4DE] space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              4. Acceptable Use
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-[#B0C4DE] space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code or content</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              5. Intellectual Property
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              The Service and its original content, features, and functionality are owned by ScentGenAI and are 
              protected by international copyright, trademark, and other intellectual property laws. User-generated 
              content remains the property of the respective users.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              6. AI-Generated Content
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              The Service uses artificial intelligence to provide recommendations and insights. While we strive 
              for accuracy, AI-generated content is provided for informational purposes only and should not be 
              considered professional advice. We do not guarantee the accuracy, completeness, or usefulness of 
              any AI-generated content.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              7. Limitation of Liability
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              To the maximum extent permitted by law, ScentGenAI shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
              directly or indirectly.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              8. Changes to Terms
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes 
              by posting the new terms on this page. Continued use of the Service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 font-playfair">
              9. Contact Us
            </h2>
            <p className="text-[#B0C4DE] leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@scentgenai.com" className="text-[#FF2E92] hover:underline">
                support@scentgenai.com
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

export default Terms;
