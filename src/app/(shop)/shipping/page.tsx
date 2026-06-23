import Breadcrumb from '@/components/ui/Breadcrumb';

export default function ShippingPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Shipping Info' }]} className="mb-6" />

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Shipping Information</h1>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Delivery Areas</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              We currently deliver to all major cities across Pakistan including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, and surrounding areas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Delivery Charges</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              Free delivery is available on orders above PKR 2,000. A standard delivery charge of PKR 150 applies to all other orders within city limits. Remote areas may have additional charges.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Processing Time</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              Orders are processed within 1-2 business days after confirmation. You will receive a confirmation email with your order details and tracking information once your order is shipped.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Estimated Delivery Times</h2>
            <ul className="list-disc list-inside text-sm text-white-muted space-y-1 leading-relaxed">
              <li>Major Cities: 2-4 business days</li>
              <li>Other Cities: 4-7 business days</li>
              <li>Remote Areas: 7-10 business days</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Cash on Delivery (COD)</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              We offer Cash on Delivery for all orders across Pakistan. Please ensure you have the exact amount ready when receiving your order. Our delivery partner will provide a receipt for your payment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
