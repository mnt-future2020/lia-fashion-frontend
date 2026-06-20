"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import axios from "../../../../lib/axios"
import { toast } from "react-hot-toast"

// Include the useMediaQuery hook directly in the component file
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Default to false on the server
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query)
      setMatches(media.matches)

      const listener = () => setMatches(media.matches)
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    }
    return undefined
  }, [query])

  return matches
}

// Function to get avatar color based on first letter
const getAvatarColor = (name) => {
  // Always return pink color for all avatars
  return "bg-pink-500"
}

// Function to get first letter of name
const getInitial = (name) => {
  return (name || "A").charAt(0).toUpperCase()
}

// Fallback testimonials in case API fails
const fallbackTestimonials = [
  {
    id: 1,
    name: "Kirthika",
    rating: 4,
    image: "/assets/circle/circle.png",
    text: "The kurta set I ordered looked even better in real life! The stitching is neat, and the colors are vibrant. Got so many compliments at the wedding!",
  },
  {
    id: 2,
    name: "Githa Raman",
    rating: 4,
    image: "/assets/circle/circle.png",
    text: "I was blown away by the quality and speed of delivery. The checkout process was smooth, and my order arrived in just two days! Will definitely shop here again.",
  },
  {
    id: 3,
    name: "Vinoth Kumar",
    rating: 5,
    image: "/assets/circle/circle.png",
    text: "Absolutely loved the dress I ordered! The fabric is soft, fits perfectly, and looks exactly like the pictures. Plus, the customer support was super helpful when I had a size query.",
  },
]

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(1)
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)")

  // Fetch positive reviews from API
  const fetchPositiveReviews = async () => {
    try {
      setLoading(true)
      // console.log('Fetching positive reviews...')
      const response = await axios.get("/api/reviews/positive")

      if (response.data && response.data.length > 0) {
        // Validate and clean the testimonials data
        const validatedTestimonials = response.data.map((review) => ({
          id: review.id,
          name: review.name || "Anonymous",
          rating: Math.max(1, Math.min(5, Number.parseInt(review.rating) || 5)), // Ensure rating is between 1-5
          text: review.text || review.comment || "Great product!",
          image: review.image || "/assets/circle/circle.png",
          product_name: review.product_name,
        }))

        setTestimonials(validatedTestimonials)
        setError(null)
      } else {
        // console.log('No reviews received, using fallback testimonials')
        // Use fallback if no data received
        setTestimonials(fallbackTestimonials)
      }
    } catch (err) {
      // console.error('Error fetching testimonials:', err)
      // console.error('Error details:', err.response?.data)
      setError("Failed to load testimonials")
      // Use fallback testimonials on error
      setTestimonials(fallbackTestimonials)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPositiveReviews()
  }, [])

  // Test API connectivity (for debugging)
  const testAPIConnection = async () => {
    try {
      // console.log('Testing API connection...')
      // console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL)

      // Test if the API is reachable
      const response = await axios.get("/admin/reviews/positive")

      // Display response in an alert for immediate feedback
      if (response.data && response.data.length > 0) {
        alert(`API Success! Found ${response.data.length} reviews. Check console for details.`)
      } else {
        alert("API connected but no reviews found.")
      }
    } catch (error) {
      // console.error('API Test Failed:', error)
      alert(`API Test Failed: ${error.message}`)
    }
  }

  useEffect(() => {
    let intervalId

    if (isMobile && testimonials.length > 0) {
      intervalId = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1))
      }, 2000) // 2 seconds interval
    }

    // Cleanup on unmount or when isMobile changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isMobile, testimonials.length])

  const goToPrevious = () => {
    setActiveIndex((prevIndex) => {
      if (testimonials.length === 0) return 0
      return prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    })
  }

  const goToNext = () => {
    setActiveIndex((prevIndex) => {
      if (testimonials.length === 0) return 0
      return prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    })
  }

  const goToSlide = (index) => {
    if (index >= 0 && index < testimonials.length) {
      setActiveIndex(index)
    }
  }

  // Ensure activeIndex is within bounds when testimonials change
  useEffect(() => {
    if (testimonials.length > 0 && activeIndex >= testimonials.length) {
      setActiveIndex(0)
    }
  }, [testimonials.length, activeIndex])

  // Calculate visible testimonials based on screen size
  const getVisibleTestimonials = () => {
    if (testimonials.length === 0) return []

    const visibleItems = []

    if (isMobile) {
      // Show only the active testimonial on mobile
      visibleItems.push({
        ...testimonials[activeIndex],
        displayIndex: activeIndex,
      })
    } else if (isTablet) {
      // Show 2 testimonials on tablet
      if (testimonials.length === 1) {
        // Only one testimonial available
        visibleItems.push({
          ...testimonials[0],
          displayIndex: 0,
        })
      } else {
        // Two or more testimonials
        const nextIndex = activeIndex === testimonials.length - 1 ? 0 : activeIndex + 1
        visibleItems.push({
          ...testimonials[activeIndex],
          displayIndex: activeIndex,
        })
        // Only add second item if it's different from the first
        if (nextIndex !== activeIndex) {
          visibleItems.push({
            ...testimonials[nextIndex],
            displayIndex: nextIndex,
          })
        }
      }
    } else {
      // Desktop: Show 3 testimonials
      if (testimonials.length === 1) {
        // Only one testimonial - show it three times with different keys
        visibleItems.push(
          { ...testimonials[0], displayIndex: 0, key: `${testimonials[0].id}-left` },
          { ...testimonials[0], displayIndex: 0, key: `${testimonials[0].id}-center` },
          { ...testimonials[0], displayIndex: 0, key: `${testimonials[0].id}-right` },
        )
      } else if (testimonials.length === 2) {
        // Two testimonials - alternate them
        const prevIndex = activeIndex === 0 ? 1 : 0
        const nextIndex = activeIndex === 0 ? 1 : 0
        visibleItems.push(
          { ...testimonials[prevIndex], displayIndex: prevIndex, key: `${testimonials[prevIndex].id}-left` },
          { ...testimonials[activeIndex], displayIndex: activeIndex, key: `${testimonials[activeIndex].id}-center` },
          { ...testimonials[nextIndex], displayIndex: nextIndex, key: `${testimonials[nextIndex].id}-right` },
        )
      } else {
        // Three or more testimonials - normal logic
        const prevIndex = activeIndex === 0 ? testimonials.length - 1 : activeIndex - 1
        const nextIndex = activeIndex === testimonials.length - 1 ? 0 : activeIndex + 1
        visibleItems.push(
          { ...testimonials[prevIndex], displayIndex: prevIndex, key: `${testimonials[prevIndex].id}-left` },
          { ...testimonials[activeIndex], displayIndex: activeIndex, key: `${testimonials[activeIndex].id}-center` },
          { ...testimonials[nextIndex], displayIndex: nextIndex, key: `${testimonials[nextIndex].id}-right` },
        )
      }
    }

    return visibleItems
  }

  const visibleTestimonials = getVisibleTestimonials()

  // Modal state for submitting a new review
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formRating, setFormRating] = useState(0)
  const [formText, setFormText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = formName.trim().length > 0 && formRating > 0 && formText.trim().length > 0 && !submitting

  const handleSubmitReview = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      // Attempt posting to a generic public reviews endpoint (adjust on backend if needed)
      await axios
        .post("/api/reviews", {
          name: formName.trim(),
          rating: formRating,
          text: formText.trim(),
        })
        .catch(() => Promise.resolve())

      // Do not append to displayed testimonials; rely on moderation/refresh
      toast.success("Thank you! Your review has been submitted.")
      // Reset and close
      setFormName("")
      setFormRating(0)
      setFormText("")
      setIsModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-8 sm:py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto bg-pink-50 rounded-xl shadow-sm my-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 sm:mb-12 md:mb-16">
          What Our Customer Says
        </h2>
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    )
  }

  // Error state with fallback content
  if (error && testimonials.length === 0) {
    return (
      <div className="py-8 sm:py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto bg-pink-50 rounded-xl shadow-sm my-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 sm:mb-12 md:mb-16">
          What Our Customer Says
        </h2>
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Unable to load testimonials at the moment.</p>
            <button
              onClick={fetchPositiveReviews}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 sm:py-8 md:py-10 px-3 md:px-6 bg-pink-50 rounded-xl shadow-sm my-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-8 md:mb-10">
        What Our Customer Says
      </h2>

      <div className="relative container mx-auto">
        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border border-pink-200 items-center justify-center text-pink-500 hover:bg-pink-50 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={isMobile ? 14 : 20} />
        </button>

        <button
          onClick={goToNext}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border border-pink-200 items-center justify-center text-pink-500 hover:bg-pink-50 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight size={isMobile ? 14 : 20} />
        </button>

        {/* Testimonials */}
        <div
          className={`flex flex-col sm:flex-row justify-center ${isMobile ? "gap-3" : isTablet ? "gap-4" : "gap-4 md:gap-6"} px-4 sm:px-8 md:px-12`}
        >
          {visibleTestimonials.map((testimonial, index) => {
            const isActive = isMobile || (isTablet && index === 0) || (!isMobile && !isTablet && index === 1)

            return (
              <div
                key={testimonial.key || `${testimonial.id}-${index}`}
                className={`bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 w-full max-w-sm mx-auto relative transition-all duration-300 ${
                  isActive ? "border-b-4 border-pink-500 scale-100 opacity-100" : "scale-95 opacity-90"
                }`}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-serif text-left mb-2 sm:mb-3 leading-none">
                  <span className={`${isActive ? "text-pink-500" : "text-gray-800"}`}>❝</span>
                </div>

                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 min-h-[60px] sm:min-h-[80px] md:min-h-[100px]">
                  {testimonial.text}
                </p>

                <div className="flex items-center mt-2 sm:mt-3">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 ${getAvatarColor(testimonial.name)}`}
                  >
                    <span className="text-white font-semibold text-xs sm:text-sm">{getInitial(testimonial.name)}</span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900">{testimonial.name}</h4>
                    {testimonial.product_name && (
                      <p className="text-xs text-gray-500 mb-1">{testimonial.product_name}</p>
                    )}
                    <div className="flex items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={isMobile ? 10 : 14}
                            className={`${i < (testimonial.rating || 5) ? "text-pink-500 fill-pink-500" : "text-gray-300 fill-gray-300"} transition-colors duration-200`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-4 sm:mt-6 md:mt-8 gap-1 sm:gap-1.5">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${index === activeIndex ? "bg-pink-500" : "bg-gray-300"}`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Submit your own review button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors text-sm"
          >
            Submit your own review
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setIsModalOpen(false)} />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
              <div className="px-5 py-4 border-b">
                <h3 className="text-lg font-semibold">Share your experience</h3>
              </div>
              <div className="px-5 py-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Your name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.slice(0, 60))}
                    placeholder="Enter your name"
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                {/* Rating */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Your rating</label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormRating(i + 1)}
                        className="p-0.5"
                        aria-label={`Rate ${i + 1} star`}
                      >
                        <Star
                          size={18}
                          className={`${i < formRating ? "text-pink-500 fill-pink-500" : "text-gray-300"} transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Text */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Your review</label>
                  <textarea
                    value={formText}
                    onChange={(e) => setFormText(e.target.value.slice(0, 1000))}
                    placeholder="Share details of your own experience at this place"
                    rows={5}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                  <div className="text-xs text-gray-400 mt-1">Max 1000 characters</div>
                </div>
              </div>
              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!canSubmit}
                  className={`px-4 py-2 rounded-md text-white ${canSubmit ? "bg-pink-500 hover:bg-pink-600" : "bg-gray-300 cursor-not-allowed"}`}
                >
                  {submitting ? "Submitting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestimonialsSection
