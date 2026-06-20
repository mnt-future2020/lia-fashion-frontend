"use client"

import { useEffect, useState } from "react"
import axios from "../../../../lib/axios"
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import { toast } from 'react-hot-toast'
import DeleteConfirmation from '@/components/DeleteConfirmation/Confirmation'

export default function AdminSiteReviewsPage() {
  const [data, setData] = useState({ data: [], current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [approvedFilter, setApprovedFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    reviewId: null
  })

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), per_page: '20' })
      if (approvedFilter !== 'all') params.set('approved', approvedFilter)
      if (debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim())
      const { data } = await axios.get(`/api/admin/site-reviews?${params.toString()}`)
      setData(data)
    } finally {
      setLoading(false)
    }
  }
  

  useEffect(() => { fetchData(1) // eslint-disable-next-line
  }, [approvedFilter, debouncedSearchQuery])

  // Debounce search to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleApprove = async (id, isApproved) => {
    try {
      await axios.patch(`/api/admin/site-reviews/${id}/approve`, { is_approved: !isApproved })
      toast.success(isApproved ? 'Review unapproved successfully' : 'Review approved successfully')
      fetchData(data.current_page)
    } catch (error) {
      toast.error('Failed to update review status')
      console.error('Error toggling approval:', error)
    }
  }

  const handleDelete = async (id) => {
    setDeleteConfirmation({ isOpen: true, reviewId: id })
  }

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/admin/site-reviews/${deleteConfirmation.reviewId}`)
      toast.success('Review deleted successfully')
      fetchData(data.current_page)
      setDeleteConfirmation({ isOpen: false, reviewId: null })
    } catch (error) {
      toast.error('Failed to delete review')
      console.error('Error deleting review:', error)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <Header headerName={"Website Reviews"} />
      <h1 className="text-2xl font-semibold mb-4">Site reviews</h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Filter:</span>
          <select
            value={approvedFilter}
            onChange={(e) => setApprovedFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <input
            type="text"
            placeholder="Search by name or review..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-1 min-w-[250px] focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300"
          />
        </div>
      </div>

      <div className="bg-white rounded shadow divide-y">
        {loading && <div className="p-4">Loading...</div>}
        {!loading && data.data.length === 0 && <div className="p-4">No reviews</div>}
        {data.data.map((r) => (
          <div key={r.id} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center">
              {(r.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-700 mt-1">Rating: {r.rating}/5</div>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{r.text}</p>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => toggleApprove(r.id, r.is_approved)} className={`px-3 py-1 rounded text-white ${r.is_approved ? 'bg-gray-500' : 'bg-green-600'}`}>
                  {r.is_approved ? 'Unapprove' : 'Approve'}
                </button>
                <button onClick={() => handleDelete(r.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Simple pagination */}
      {data.last_page > 1 && (
        <div className="mt-4 flex gap-2">
          <button disabled={data.current_page === 1} onClick={() => fetchData(data.current_page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <div className="px-3 py-1">Page {data.current_page} of {data.last_page}</div>
          <button disabled={data.current_page === data.last_page} onClick={() => fetchData(data.current_page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, reviewId: null })}
        onDelete={confirmDelete}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
      />
    </div>
  )
}


