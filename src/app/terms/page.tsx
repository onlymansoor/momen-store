import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p className="text-lg leading-relaxed">
            Welcome to Momen Store. By using our website and purchasing our products, you agree to the following terms and conditions. Please read them carefully before making a purchase.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">1. General</h2>
          <p>
            These Terms & Conditions govern your use of the Momen Store website and the purchase of any products from it. We reserve the right to update these terms at any time without prior notice. Continued use of the site constitutes acceptance of any changes.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Products & Pricing</h2>
          <p>
            All product descriptions, images, and pricing are subject to change without notice. We make every effort to display accurate information but do not guarantee that product descriptions or prices are error-free. In the event of a pricing error, we reserve the right to cancel the order.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Orders</h2>
          <p>
            By placing an order, you agree to provide accurate and complete information. We reserve the right to refuse or cancel any order for any reason, including product availability, errors in pricing, or suspected fraud. Order confirmation does not constitute acceptance of the order.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Payment</h2>
          <p>
            We offer Cash on Delivery and Easypaisa as payment methods. Full payment is required before order processing for Easypaisa orders. For Cash on Delivery orders, payment is collected upon delivery. Please ensure exact change when paying with cash.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Shipping & Delivery</h2>
          <p>
            We deliver across Pakistan. Delivery times vary depending on your location and product availability. We are not responsible for delays caused by circumstances beyond our control, including natural disasters, courier delays, or customs processing.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Returns & Refunds</h2>
          <p>
            We accept returns within 7 days of delivery for defective or incorrect items. Products must be unused and in their original packaging. Refunds will be processed after inspection. Shipping charges are non-refundable unless the return is due to our error.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Intellectual Property</h2>
          <p>
            All content on this website, including text, images, logos, and designs, is the property of Momen Store and is protected by applicable intellectual property laws. Unauthorized use of any content is strictly prohibited.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Limitation of Liability</h2>
          <p>
            Momen Store shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use our products or website. Our total liability in any case shall not exceed the amount paid for the product in question.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes arising from these terms shall be resolved in the courts of Pakistan.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">10. Contact</h2>
          <p>
            For any questions or concerns regarding these Terms & Conditions, please contact us through our website or visit our contact page.
          </p>

          <p className="text-sm text-gray-500 mt-12 pt-6 border-t border-gray-200">
            Last updated: June 2026
          </p>
        </div>
      </div>
    </div>
  );
}
