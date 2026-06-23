import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p className="text-lg leading-relaxed">
            At Momen Store, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including your name, email address, phone number, shipping address, and payment details when you place an order. We also automatically collect certain information when you visit our website, such as your IP address, browser type, and browsing behavior.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to process your orders, communicate with you about your purchases, improve our website and services, send you marketing communications (with your consent), and comply with legal obligations.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Payment Information</h2>
          <p>
            We accept Cash on Delivery and Easypaisa. Payment details are processed securely and are not stored on our servers. We use industry-standard encryption to protect your payment information during transmission.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Data Protection</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. Your data is stored on secure servers and is only accessible by authorized personnel. We regularly review and update our security practices to protect against unauthorized access.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Cookies</h2>
          <p>
            We use cookies to enhance your browsing experience, analyze site traffic, and understand where our visitors come from. You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of our website.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Third-Party Disclosure</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website or servicing you, provided they agree to keep your information confidential.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data at any time. You may also opt out of marketing communications by contacting us directly. We will respond to your request within a reasonable timeframe.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. Changes are effective immediately upon posting.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through our website or visit our contact page.
          </p>

          <p className="text-sm text-gray-500 mt-12 pt-6 border-t border-gray-200">
            Last updated: June 2026
          </p>
        </div>
      </div>
    </div>
  );
}
