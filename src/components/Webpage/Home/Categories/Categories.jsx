import Image from "next/image"
import Link from "next/link"

export default function Categories() {
  const categories = [
    { id: 1, name: "Category Name", count: "counting", image: "/assets/circle/circle01.png" },
    { id: 2, name: "Category Name", count: "counting", image: "/assets/circle/circle02.png" },
    { id: 3, name: "Category Name", count: "counting", image: "/assets/circle/circle03.png" },
    { id: 4, name: "Category Name", count: "counting", image: "/assets/circle/circle01.png" },
    { id: 5, name: "Category Name", count: "counting", image: "/assets/circle/circle02.png" },
    // { id: 6, name: "Category Name", count: "counting", image: "/assets/circle/circle01.png" },
    // { id: 7, name: "Category Name", count: "counting", image: "/assets/circle/circle02.png" },
    // { id: 8, name: "Category Name", count: "counting", image: "/assets/circle/circle03.png" },
    // { id: 9, name: "Category Name", count: "counting", image: "/assets/circle/circle01.png" },
    // { id: 10, name: "Category Name", count: "counting", image: "/assets/circle/circle02.png" },
  ]

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Shop by Category</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most coveted pieces that everyone&apos;s talking about
          </p>
          <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
        </div>
        <div className="relative">
          <div className="flex overflow-x-auto pb-8 space-x-6 justify-start md:justify-center items-center">
            {categories.map((category) => (
              <div key={category.id} className="flex-none w-32 md:w-44">
                <Link href={`/category/${category.id}`} className="block">
                  <div className="rounded-full overflow-hidden mb-4">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      width={120}
                      height={120}
                      className="w-full h-auto object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h3 className="text-center font-medium text-gray-800">{category.name}</h3>
                  <p className="text-center text-gray-500 text-sm">{category.count}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
