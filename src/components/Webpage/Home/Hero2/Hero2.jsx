"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image";

export default function Hero2() {
  const categories = [
    { id: 1, name: "Category Name",  image: "/assets/circle/circle01.png" },
    { id: 2, name: "Category Name",  image: "/assets/circle/circle02.png" },
    { id: 3, name: "Category Name",  image: "/assets/circle/circle03.png" },
    { id: 4, name: "Category Name",  image: "/assets/circle/circle01.png" },
    { id: 5, name: "Category Name",  image: "/assets/circle/circle02.png" },
    { id: 6, name: "Category Name",  image: "/assets/circle/circle02.png" },
    { id: 7, name: "Category Name",  image: "/assets/circle/circle02.png" },
  ];

  return (
    <section className="py-16 px-4 bg-pink-100">
      <div className="relative items-center justify-center flex flex-col max-w-7xl mx-auo">
        <div className="flex overflow-x-auto pb-8 space-x-6 no-scrollbar">
          {categories.map((category) => (
            <div key={category.id} className="flex-none w-48 md:w-56">
              <Link href={`/category/${category.id}`} className="block">
                <div className="rounded-full overflow-hidden mb-4">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    width={140}
                    height={140}
                    className="w-full h-auto object-cover transition-transform hover:scale-105"
                  />
                </div>
                <h3 className="text-center font-medium text-gray-800">{category.name}</h3>
              </Link>
            </div>
          ))}
        </div>/
      </div>
    </section>
  );
}