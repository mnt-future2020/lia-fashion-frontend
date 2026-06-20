"use client"
import { useEffect, useMemo, useState } from "react"
import axios from "../../../../lib/axios"
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"
import DeleteConfirmation from "@/components/DeleteConfirmation/Confirmation"
import { toast } from 'react-hot-toast'

export default function AdminPromoPopupsPage() {
  const [data, setData] = useState({ data: [], current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null })

  const emptyForm = {
    enabled: true,
    title: "",
    message: "",
    cta_label: "SHOP NOW",
    cta_url: "/",
    frequency: "once",
    target_pages: ["home"],
    theme: { titleColor: "#166534", textColor: "#111827", ctaBg: "#1d4ed8", ctaText: "#ffffff" }
  }
  const [form, setForm] = useState(emptyForm)

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), per_page: '20' })
      const { data } = await axios.get(`/api/admin/promo-popups?${params.toString()}`)
      setData(data)
    } catch (e) {
      toast.error('Failed to load promo popups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(1) // eslint-disable-next-line
  }, [])

  const startCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const startEdit = (row) => {
    setEditing(row)
    setForm({
      enabled: !!row.enabled,
      title: row.title || "",
      message: row.message || "",
      cta_label: row.cta_label || "",
      cta_url: row.cta_url || "",
      frequency: row.frequency || "once",
      // Force target_pages to home
      target_pages: ["home"],
      theme: row.theme || {}
    })
    setFormOpen(true)
  }

  const save = async () => {
    try {
      setSaving(true)
      const payload = { ...form }
      // Always enforce target_pages to ['home'] regardless of UI
      payload.target_pages = ["home"]
      if (!payload.title?.trim()) delete payload.title
      if (!payload.message?.trim()) delete payload.message
      const req = editing
        ? axios.put(`/api/admin/promo-popups/${editing.id}`, payload)
        : axios.post(`/api/admin/promo-popups`, payload)
      const res = await req
      toast.success(editing ? 'Popup updated' : 'Popup created')
      setFormOpen(false)
      setEditing(null)
      setForm(emptyForm)
      // optimistically refetch first page
      fetchData(data.current_page)
    } catch (e) {
      toast.error('Failed to save popup')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation.id) return
    try {
      await axios.delete(`/api/admin/promo-popups/${deleteConfirmation.id}`)
      toast.success('Popup deleted')
      setDeleteConfirmation({ isOpen: false, id: null })
      fetchData(data.current_page)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return data.data
    return (data.data || []).filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.message || '').toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Header headerName={"Promo Popups"} />
      <h1 className="text-2xl font-semibold mb-4">Promo popups</h1>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Input placeholder="Search by title or message" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-72" />
        </div>
        <Button onClick={startCreate} className="bg-[#eb1c75] hover:bg-pink-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Popup
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading && <div className="p-4">Loading...</div>}
          {!loading && filtered.length === 0 && <div className="p-4">No popups</div>}
          {!loading && filtered.length > 0 && (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <Switch checked={!!r.enabled} disabled className="data-[state=checked]:bg-pink-500" />
                      <div className="font-medium">{r.title || 'Untitled'}</div>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{r.frequency}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{r.message}</div>
                    <div className="text-xs text-gray-500 mt-1">Pages: {(Array.isArray(r.target_pages) ? r.target_pages.join(', ') : 'all') || 'all'}</div>
                  </div>
                  <div className="flex items-start md:items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(r)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmation({ isOpen: true, id: r.id })}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Drawer (simple inline form modal) */}
      {formOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">{editing ? 'Edit Popup' : 'Create Popup'}</div>
              <button onClick={() => { setFormOpen(false); setEditing(null) }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={!!form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} className="data-[state=checked]:bg-pink-500" />
                <span className="text-sm">Enabled</span>
              </div>
              <div>
                <label className="text-sm text-gray-600">Frequency</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full border rounded px-2 py-2">
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="always">Always</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Title</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Message</label>
                <textarea className="w-full border rounded px-2 py-2 min-h-[100px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">CTA Label</label>
                <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">CTA URL</label>
                <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
              </div>
              {/* Target pages fixed to 'home' */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Target Pages</label>
                <div className="mt-2 text-sm px-3 py-2 border rounded bg-gray-50">home (fixed)</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-24">Title Color</label>
                  <input type="color" value={form.theme?.titleColor || '#166534'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, titleColor: e.target.value } })} className="h-9 w-12 p-0 border rounded" />
                  <span className="text-xs text-gray-500">{form.theme?.titleColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-24">Text Color</label>
                  <input type="color" value={form.theme?.textColor || '#111827'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, textColor: e.target.value } })} className="h-9 w-12 p-0 border rounded" />
                  <span className="text-xs text-gray-500">{form.theme?.textColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-24">CTA BG</label>
                  <input type="color" value={form.theme?.ctaBg || '#1d4ed8'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, ctaBg: e.target.value } })} className="h-9 w-12 p-0 border rounded" />
                  <span className="text-xs text-gray-500">{form.theme?.ctaBg}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-24">CTA Text</label>
                  <input type="color" value={form.theme?.ctaText || '#ffffff'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, ctaText: e.target.value } })} className="h-9 w-12 p-0 border rounded" />
                  <span className="text-xs text-gray-500">{form.theme?.ctaText}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setFormOpen(false); setEditing(null) }}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-[#eb1c75] hover:bg-pink-600 text-white">{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
        onDelete={confirmDelete}
        title="Delete Popup"
        description="Are you sure you want to delete this popup? This action cannot be undone."
      />
    </div>
  )
}


