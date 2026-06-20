"use client"

import { useEffect, useMemo, useState } from "react"
import { Star } from "lucide-react"
import { toast } from "react-hot-toast"
import axios from "../../../lib/axios"

const StarRow = ({ label, value, total }) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-gray-700">{label}</span>
      <div className="h-2 flex-1 bg-gray-200 rounded">
        <div className="h-2 bg-yellow-400 rounded" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-right text-gray-600">{value}</span>
    </div>
  )
}

const RatingStars = ({ rating = 0, size = 14 }) => (
  <div className="flex items-center">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={size} className={`${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ))}
  </div>
)

const Avatar = ({ name }) => {
  const initial = (name || '').charAt(0).toUpperCase() || 'A'
  return (
    <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center">
      {initial}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('relevant') // relevant | newest | highest
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formRating, setFormRating] = useState(0)
  const [formText, setFormText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get('/api/reviews')
        if (!active) return
        const normalized = (Array.isArray(data) ? data : []).map((r, idx) => ({
          id: r.id ?? idx,
          name: r.name || 'Anonymous',
          rating: Number(r.rating) || 5,
          text: r.text || r.comment || '',
          created_at: r.created_at || null,
        }))
        setReviews(normalized)
      } catch (_e) {
        setReviews([])
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchReviews()
    return () => { active = false }
  }, [])

  const stats = useMemo(() => {
    const total = reviews.length
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of reviews) {
      const key = Math.max(1, Math.min(5, Math.round(r.rating)))
      counts[key]++
    }
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    const average = total ? (sum / total) : 0
    return { total, counts, average: Math.round(average * 10) / 10 }
  }, [reviews])

  const sorted = useMemo(() => {
    const copy = [...reviews]
    switch (sort) {
      case 'newest':
        return copy.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      case 'highest':
        return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      default:
        return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }
  }, [reviews, sort])

  // Reset to first page when sort changes or new data loads
  useEffect(() => {
    setCurrentPage(1)
  }, [sort, reviews.length])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const startIndex = (currentPage - 1) * perPage
  const pageItems = sorted.slice(startIndex, startIndex + perPage)
  const canSubmit = formName.trim().length > 0 && formRating > 0 && formText.trim().length > 0 && !submitting

  const handleSubmitReview = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      await axios.post('/api/reviews', {
        name: formName.trim(),
        rating: formRating,
        text: formText.trim(),
      }).catch(() => Promise.resolve())
      toast.success('Thank you! Your review has been submitted.')
      setFormName("")
      setFormRating(0)
      setFormText("")
      setIsModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-semibold">Customer Reviews</h1>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-md bg-pink-500 hover:bg-pink-600 text-white text-sm">Write a review</button>
        </div>
        <div className="text-sm text-gray-600 mb-6">Reviews from the web</div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Liafashion review summary</div>
              <div className="space-y-2">
                {[5,4,3,2,1].map(star => (
                  <StarRow key={star} label={star} value={stats.counts[star] || 0} total={stats.total} />
                ))}
              </div>
            </div>
            <div className="flex items-center md:justify-end">
              <div className="text-right">
                <div className="text-4xl font-semibold">{stats.average || 0}</div>
                <RatingStars rating={Math.round(stats.average)} size={18} />
                <div className="text-xs text-gray-500 mt-1">{stats.total} reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-700">Sort by</span>
          <div className="flex gap-2">
            {[
              { key: 'relevant', label: 'Most relevant' },
              { key: 'newest', label: 'Newest' },
              { key: 'highest', label: 'Highest' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`px-3 py-1.5 rounded-full text-sm border ${sort === opt.key ? 'bg-pink-50 text-pink-600 border-pink-200' : 'hover:bg-gray-100'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        <div className="bg-white rounded-lg shadow divide-y">
          {loading && (
            <div className="p-6 text-gray-500">Loading reviews...</div>
          )}
          {!loading && sorted.length === 0 && (
            <div className="p-6 text-gray-500">No reviews yet.</div>
          )}
          {pageItems.map(r => (
            <div key={r.id} className="p-4 md:p-6">
              <div className="flex items-start gap-3">
                <Avatar name={r.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{r.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <RatingStars rating={Math.round(Number(r.rating) || 0)} />
                    {r.created_at && <span>• {new Date(r.created_at).toLocaleDateString()}</span>}
                  </div>
                  {r.text && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{r.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {sorted.length > perPage && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded border text-sm ${currentPage === pageNum ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-gray-100'}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            >
              Next
            </button>
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Write a review</div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600">Your name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border rounded px-2 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Rating</label>
                <div className="flex items-center gap-2 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => setFormRating(i + 1)} className={`p-1 ${i < formRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      <Star size={20} className={`${i < formRating ? 'fill-yellow-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Your review</label>
                <textarea value={formText} onChange={(e) => setFormText(e.target.value)} className="w-full border rounded px-2 py-2 min-h-[100px]" />
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button onClick={handleSubmitReview} disabled={!canSubmit} className={`px-4 py-2 rounded-md text-white ${canSubmit ? 'bg-pink-500 hover:bg-pink-600' : 'bg-gray-300 cursor-not-allowed'}`}>{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



