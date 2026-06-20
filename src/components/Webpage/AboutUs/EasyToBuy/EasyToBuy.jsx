import Image from "next/image"

export default function EasyToBuy() {
  return (
    <section className="py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">Easy to buy</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Step 1 */}
        <div className="flex flex-col lg:flex-row lg:flex-col items-start">
          <div className="flex items-start mb-4">
            <span className="text-8xl font-bold text-primary mr-4 leading-none">1</span>
            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-1">Choose item, color and size</h3>
              <p className="text-gray-600">Choose your desired style, color, and size from our curated collection.</p>
            </div>
          </div>
          <div className="w-full rounded-lg overflow-hidden lg:px-0 sm:px-10">
            <Image
              src="/assets/cover/aboutcover.png"
              alt="Product selection"
              width={400}
              height={300}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Step 2 - Cart Page */}
        <div className="space-y-12">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-xl font-medium text-center mb-4">Cart Page</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-500">Item</div>
              <div className="flex space-x-8">
                <div className="text-sm text-gray-500">Price</div>
                <div className="text-sm text-gray-500">Quantity</div>
              </div>
            </div>

            {/* Cart Item 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-md mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Quilted girl with hood</p>
                  <div className="flex items-center mt-1">
                    <div className="text-xs text-gray-500 mr-2">COLOR:</div>
                    <div className="w-4 h-4 rounded-full bg-pink-200"></div>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="text-xs text-gray-500 mr-2">SIZE:</div>
                    <div className="text-xs">M</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-sm font-medium">Rs. 1,500</div>
                <div className="flex items-center border rounded-md">
                  <button className="px-2 py-1 text-gray-500">-</button>
                  <span className="px-2 py-1">2</span>
                  <button className="px-2 py-1 text-gray-500">+</button>
                </div>
              </div>
            </div>

            {/* Cart Item 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-md mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Quilted girl with hood</p>
                  <div className="flex items-center mt-1">
                    <div className="text-xs text-gray-500 mr-2">COLOR:</div>
                    <div className="w-4 h-4 rounded-full bg-yellow-300"></div>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="text-xs text-gray-500 mr-2">SIZE:</div>
                    <div className="text-xs">M</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-sm font-medium">Rs. 1,500</div>
                <div className="flex items-center border rounded-md">
                  <button className="px-2 py-1 text-gray-500">-</button>
                  <span className="px-2 py-1">1</span>
                  <button className="px-2 py-1 text-gray-500">+</button>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="text-sm font-medium mb-2">COUPON DISCOUNT</div>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Enter your code here"
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none"
                />
                <button className="bg-primary text-white px-4 py-2 rounded-r-md text-sm">Apply</button>
              </div>
            </div>
          </div>
        </div>
           {/* Step 2 */}
          <div className="flex items-start">
            <span className="text-8xl font-bold text-primary mr-4 leading-none">2</span>
            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-1">Add to cart and procesed to checkout</h3>
              <p className="text-gray-600">
                Pick a delivery option that suits you — we ensure every piece is packed with care.
              </p>
            </div>
          </div>
          </div>
         

        {/* Steps 2 & 3 */}
        <div className="space-y-12">
      
          {/* Step 3 */}
          <div className="flex items-start">
            <span className="text-8xl font-bold text-primary mr-4 leading-none">3</span>
            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-1">Choose shipping method and wait for order</h3>
              <p className="text-gray-600">
                Add to cart, complete your secure checkout, and await your beautifully wrapped order.
              </p>
            </div>
          </div>

          {/* Shipping Form */}
          <div className="bg-pink-50 rounded-lg p-4 md:p-6">
            <h3 className="text-xl font-medium text-center mb-4">Shipping</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Street Address"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="City / Town / Village"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="State/City"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="ZIP"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <div className="relative">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none appearance-none">
                  <option value="">Country</option>
                  <option value="india">India</option>
                  <option value="usa">USA</option>
                  <option value="uk">UK</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-500"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Landmark"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
              />

              <button className="w-full bg-primary text-white py-2 rounded-md mt-4">Submit</button>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs. 1,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-800 font-medium">Order Total</span>
                  <span className="font-medium">Rs. 1,500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
