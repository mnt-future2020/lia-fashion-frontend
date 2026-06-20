"use client"

import ProductCard from "./ProductCard"

const SimilarProducts = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Similar Products</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          You might also like these products
        </p>
        <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default SimilarProducts
