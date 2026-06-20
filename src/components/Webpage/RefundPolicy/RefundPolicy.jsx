import { Box } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">Refund Policy</h2>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-2xl font-semibold mb-4">Refund Policy</h3>
            <ul className="list-disc pl-6 text-gray-700 text-lg mb-4 space-y-2">
              <li>We do not accept return requests unless:</li>
              <ul className="list-disc pl-8">
                <li>The item is defective</li>
                <li>You received the wrong product</li>
              </ul>
            </ul>
            <p className="text-gray-700 text-lg mb-2">Refunds are processed only if the issue is verified as genuine based on your claim.</p>
            <p className="text-gray-700 text-lg mb-6">Refunds will be initiated via Razorpay within 24 hours after the returned product is received and inspected.</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xl font-medium text-primary mb-4">Exchange Request Conditions</h3>
            <p className="text-gray-700 text-lg mb-4">
              Exchange request can be initiated only &#39;once per order&#39; and &#39;within 1 (one) day of delivery of the order&#39;,
              given the following conditions are satisfied:
            </p>
            <ul className="space-y-3 list-disc pl-6">
              <li className="text-gray-700 text-lg">Product(s) should be unused & unwashed</li>
              <li className="text-gray-700 text-lg">Tags should be intact</li>
              <li className="text-gray-700 text-lg">Product(s) is/are not purchased at sale/discounted price</li>
              <li className="text-gray-700 text-lg">Product(s) is/are not custom altered</li>
              <li className="text-gray-700 text-lg">Unpacking video (without pause) is a must for damage, partial, and wrong product received.</li>
              <li className="text-gray-700 text-lg">Customer will have to send the parcel back to us.</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-700 text-lg mb-6">
              Since all the products are checked properly and dispatched, we do not accept return requests unless the item is defective,
              or if you receive the wrong product. If you are affected by any of the above-mentioned ones, you can claim your exchange
              or refund request through WhatsApp +91 9384109680.
            </p>
          </div>

          <p className="text-xl text-right text-gray-700 italic">– Lia Fashions</p>
        </div>
      </div>
    </section>
  )
}
