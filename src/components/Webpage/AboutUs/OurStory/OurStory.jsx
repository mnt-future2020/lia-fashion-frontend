import { Box, Star, MessageSquare, Globe } from 'lucide-react'

export default function OurStory() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">Our Story</h2>

        <h3 className="text-xl md:text-2xl font-medium text-primary text-center mb-6">
          At Lia Fashion, Every Dress Is A Promise — Of Individuality, Quality, And Effortless Beauty.
        </h3>

        <p className="text-gray-700 mb-8 text-lg leading-relaxed">
          Born from a love for timeless craftsmanship and feminine grace, Lia Fashion was created to celebrate women who
          express their identity through elegance, not trends. What started as a passion for handcrafted boutique wear
          has grown into a curated destination for dresses that feel as personal as they look.
        </p>

        <div className="mb-8">
          <h4 className="text-xl font-medium text-primary mb-4">we are committed to:</h4>
          <ul className="space-y-3 list-disc pl-6">
            <li className="text-gray-700 text-lg">Crafting dresses that belong to you, not just fit you.</li>
            <li className="text-gray-700 text-lg">Honoring slow fashion, ethical creation, and conscious style.</li>
            <li className="text-gray-700 text-lg">
              Empowering self-expression, making every piece an intimate part of your story.
            </li>
          </ul>
          <p className="text-gray-700 text-lg mt-3">Fashion should feel personal — not seasonal.</p>
        </div>

        <div className="mt-16 bg-pink-100 p-10 rounded-lg shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">Why Choose Us</h2>
          <p className="text-xl text-center text-gray-700 mb-12">Not Just Dresses. Reflections of You.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 width-[60%]">
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 relative transition-all duration-300 hover:bg-[#ed1c75] hover:text-white group">
              <div className="flex items-center mb-4">
                <Box className="text-[#ed1c75] mr-3 group-hover:text-white" size={32} />
                <h3 className="text-xl font-medium text-gray-800 group-hover:text-white">Handpicked Designs for Unique Souls</h3>
              </div>
              <div className="absolute bottom-4 right-4 opacity-10">
                <Box className="text-[#ed1c75] group-hover:text-white" size={56} />
              </div>
            </div>

            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 relative transition-all duration-300 hover:bg-[#ed1c75] hover:text-white group">
              <div className="flex items-center mb-4">
                <Star className="text-[#ed1c75] mr-3 group-hover:text-white" size={32} />
                <h3 className="text-xl font-medium text-gray-800 group-hover:text-white">Luxurious Comfort, Tailored Elegance</h3>
              </div>
              <div className="absolute bottom-4 right-4 opacity-10">
                <Star className="text-[#ed1c75] group-hover:text-white" size={56} />
              </div>
            </div>

            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 relative transition-all duration-300 hover:bg-[#ed1c75] hover:text-white group">
              <div className="flex items-center mb-4">
                <MessageSquare className="text-[#ed1c75] mr-3 group-hover:text-white" size={32} />
                <h3 className="text-xl font-medium text-gray-800 group-hover:text-white">Ethical Craftsmanship You Can Feel</h3>
              </div>
              <div className="absolute bottom-4 right-4 opacity-10">
                <MessageSquare className="text-[#ed1c75] group-hover:text-white" size={56} />
              </div>
            </div>

            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 relative transition-all duration-300 hover:bg-[#ed1c75] hover:text-white group">
              <div className="flex items-center mb-4">
                <Globe className="text-[#ed1c75] mr-3 group-hover:text-white" size={32} />
                <h3 className="text-xl font-medium text-gray-800 group-hover:text-white">Curated Collections, Limited Pieces Only</h3>
              </div>
              <div className="absolute bottom-4 right-4 opacity-10">
                <Globe className="text-[#ed1c75] group-hover:text-white" size={56} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
