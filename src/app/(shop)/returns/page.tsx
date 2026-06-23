import Breadcrumb from '@/components/ui/Breadcrumb';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Returns & Exchanges' }]} className="mb-6" />

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Returns & Exchanges</h1>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Return Policy</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              We want you to be completely satisfied with your purchase. If you are not happy with your order, you may return it within 7 days of delivery for a full refund or exchange, subject to the conditions below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Conditions for Returns</h2>
            <ul className="list-disc list-inside text-sm text-white-muted space-y-1 leading-relaxed">
              <li>Item must be unused and in its original packaging</li>
              <li>All tags and labels must be attached</li>
              <li>Proof of purchase (order number) is required</li>
              <li>Return request must be initiated within 7 days of delivery</li>
              <li>Customized or personalized items cannot be returned</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Return Process</h2>
            <ol className="list-decimal list-inside text-sm text-white-muted space-y-1 leading-relaxed">
              <li>Contact us via WhatsApp or email within 7 days of delivery</li>
              <li>Provide your order number and reason for return</li>
              <li>Our team will review and confirm the return</li>
              <li>Pack the item securely in its original packaging</li>
              <li>Ship the item back or we arrange pickup (within city limits)</li>
              <li>Refund will be processed within 3-5 business days after we receive the item</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Refunds</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              Refunds are processed to the original payment method. For Cash on Delivery orders, refunds are transferred via Easypaisa or JazzCash within 3-5 business days after the returned item is received and inspected.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Exchanges</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              Exchanges for a different size, color, or product are treated as a return of the original item and a new purchase. Please initiate a return and place a new order for the desired item.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Non-Returnable Items</h2>
            <ul className="list-disc list-inside text-sm text-white-muted space-y-1 leading-relaxed">
              <li>Personal care and hygiene products</li>
              <li>Intimate apparel</li>
              <li>Customized or personalized items</li>
              <li>Digital products and downloads</li>
              <li>Items marked as final sale</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
