'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Privacy Policy' },
          ]}
          className="mb-8"
        />

        <div className="glass rounded-2xl p-6 sm:p-8 md:p-10 space-y-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Privacy Policy</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-white/80">
            <p className="text-lg leading-relaxed">
              At Momen Store, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
            </p>

            <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including your name, email address, phone number, shipping address, and payment details when you place an order. We also automatically collect certain information when you visit our website, such as your IP address, browser type, and browsing behavior.
            </p>

            <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to process your orders, communicate with you about your purchases, improve our website and services, send you marketing communications (with your consent), and comply with legal obligations.
            </p>

            <h2 className="text-xl font-semibold text-white">3. Payment Information</h2>
            <p>
              We accept Cash on Delivery and Easypaisa. Payment details are processed securely and are not stored on our servers. We use industry-standard encryption to protect your payment information during transmission.
            </p>

            <h2 className="text-xl font-semibold text-white">4. Data Protection</h2>
            <p>
              We implement a variety of security measures to maintain the safety of your personal information. Your data is stored on secure servers and is only accessible by authorized personnel. We regularly review and update our security practices to protect against unauthorized access.
            </p>

            <h2 className="text-xl font-semibold text-white">5. Cookies</h2>
            <p>
              We use cookies to enhance your browsing experience, analyze site traffic, and understand where our visitors come from. You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of our website.
            </p>

            <h2 className="text-xl font-semibold text-white">6. Third-Party Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website or servicing you, provided they agree to keep your information confidential.
            </p>

            <h2 className="text-xl font-semibold text-white">7. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time. You may also opt out of marketing communications by contacting us directly. We will respond to your request within a reasonable timeframe.
            </p>

            <h2 className="text-xl font-semibold text-white">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. Changes are effective immediately upon posting.
            </p>

            <h2 className="text-xl font-semibold text-white">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through our website or visit our contact page.
            </p>

            <p className="text-sm text-white/40 mt-8 pt-6 border-t border-white/10">
              Last updated: June 2026
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-light text-sm font-medium mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}