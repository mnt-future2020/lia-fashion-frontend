"use client"

import Link from "next/link"
import { ChevronRight, Star } from "lucide-react"

export default function TestimonialsButton() {
  return (
    <>
      {/* View All Button */}
      <div className="text-center my-10">
        <Link href="/reviews">
          <button className="w-72 group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out overflow-hidden">
            {/* Background animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Button content */}
            <div className="relative flex items-center justify-center gap-2">
              <span>View All Reviews</span>
              <div className="flex">
                <Star size={16} className="text-yellow-300 fill-yellow-300" />
                <Star size={16} className="text-yellow-300 fill-yellow-300 -ml-1" />
                <Star size={16} className="text-yellow-300 fill-yellow-300 -ml-1" />
              </div>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
          </button>
        </Link>
      </div>
    </>
  )
}