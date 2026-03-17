import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGalleries } from '../../hooks/useGalleries'
import { Topbar } from '../../components/layout/Topbar'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import type { Gallery } from '../../types/database'

const STATUS_FILTERS = ['all', 'published', 'draft', 'expired'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

export function Galleries() {
  const { user } = useAuth()
  const { galleries, loading, deleteGallery } = useGalleries(user?.id)
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState('newest')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null)
  const [copied, setCopied] = useState(false)

  const filtered = galleries
    .filter(g => filter === 'all' || g.status === filter)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'views')  return b.view_count - a.view_count
      return a.title.localeCompare(b.title)
    })

  async function handleDelete() {
    if (!deleteId || deleteConfirm !== 'DELETE') return
    try {
      await deleteGallery(deleteId)
      toast.show('Gallery deleted')
    } catch {
      toast.show('Failed to delete gallery', 'error')
    } finally {
      setDeleteId(null)
      setDeleteConfirm('')
    }
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/g/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.show('Link copied!')
  }

  const statusTag = (status: string) => {
    const map: Record<string, string> = {
      published: 'bg-ink/60 text-white/90',
      draft:     'bg-white/75 text-ink-mid',
      expired:   'bg-red/85 text-white',
    }
    return map[status] ?? map.draft
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Galleries" showNew />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Toolbar */}
          <div className="flex items-center gap-2.5 mb-6 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-[7px] rounded-full border font-ui text-[12.5px] font-medium cursor-pointer transition-all capitalize ${
                  filter === f
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-mid border-border hover:bg-teal-pale hover:border-teal hover:text-teal'
                }`}
              >
                {f}
              </button>
            ))}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="ml-auto px-3 py-[7px] rounded-lg border border-border bg-white font-ui text-[12.5px] text-ink outline-none cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="views">Most views</option>
              <option value="alpha">A–Z</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-[18px]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-border rounded-[14px] h-[290px] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-[14px] p-16 text-center">
              <p className="font-display text-[22px] font-light text-ink mb-2">No galleries found</p>
              <p className="text-[13px] text-ink-muted mb-5">Try a different filter or create a new gallery.</p>
              <Button variant="teal" onClick={() => navigate('/dashboard/new')}>Create Gallery</Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[18px]">
              {filtered.map(g => (
                <div
                  key={g.id}
                  className="bg-white border border-border rounded-[14px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card hover:border-teal-pale group"
                >
                  <div
                    className="h-[185px] relative overflow-hidden bg-teal-pale"
                    onClick={() => navigate(`/dashboard/gallery/${g.id}`)}
                  >
                    {g.cover_url ? (
                      <img src={g.cover_url} alt={g.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-teal/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3.5">
                      <div className="flex gap-1.5">
                        <button className="px-3 py-1.5 rounded-md border border-white/30 bg-white/15 backdrop-blur-sm text-white text-[11px] font-medium font-ui hover:bg-white/28 transition-colors">Edit</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`/g/${g.slug}`, '_blank') }}
                          className="px-3 py-1.5 rounded-md border border-white/30 bg-white/15 backdrop-blur-sm text-white text-[11px] font-medium font-ui hover:bg-white/28 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`text-[10px] font-semibold tracking-[0.07em] uppercase px-2.5 py-[3px] rounded-full backdrop-blur-sm ${statusTag(g.status)}`}>{g.status}</span>
                      {g.pin_enabled && <span className="text-[10px] font-semibold tracking-[0.07em] uppercase px-2.5 py-[3px] rounded-full backdrop-blur-sm bg-teal/90 text-ink">PIN</span>}
                    </div>
                  </div>

                  <div className="px-[18px] pt-4 pb-[18px]">
                    <div
                      className="font-display text-[17px] font-medium text-ink mb-[3px] cursor-pointer"
                      onClick={() => navigate(`/dashboard/gallery/${g.id}`)}
                    >
                      {g.title}
                    </div>
                    <div className="text-[12px] text-ink-muted mb-3.5">
                      {g.client_name ?? 'No client'} · {new Date(g.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center justify-between border-t border-teal-pale pt-3">
                      <span className="flex items-center gap-1 text-[12px] text-ink-mid">
                        <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {g.view_count} views
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setShareGallery(g)}
                          className="w-7 h-7 rounded-md border border-border bg-transparent cursor-pointer flex items-center justify-center text-ink-muted transition-all hover:border-teal hover:text-teal hover:bg-teal-pale"
                          title="Share"
                        >
                          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(g.id)}
                          className="w-7 h-7 rounded-md border border-border bg-transparent cursor-pointer flex items-center justify-center text-ink-muted transition-all hover:border-red hover:text-red hover:bg-pink"
                          title="Delete"
                        >
                          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete modal */}
      <Modal
        open={!!deleteId}
        onClose={() => { setDeleteId(null); setDeleteConfirm('') }}
        title="Delete Gallery?"
        subtitle="This permanently removes the gallery and all photos. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setDeleteId(null); setDeleteConfirm('') }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteConfirm !== 'DELETE'}>Delete</Button>
          </>
        }
      >
        <div className="mb-[18px]">
          <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
            Type "DELETE" to confirm
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(224,120,120,0.15)]"
            placeholder="DELETE"
          />
        </div>
      </Modal>

      {/* Share modal */}
      <Modal
        open={!!shareGallery}
        onClose={() => setShareGallery(null)}
        title="Share Gallery"
        subtitle="Send this link to your client to access their gallery."
      >
        {shareGallery && (
          <div className="bg-teal-pale rounded-lg px-3 py-2.5 flex items-center gap-2">
            <span className="text-[12px] text-ink flex-1 truncate font-ui">
              {window.location.origin}/g/{shareGallery.slug}
            </span>
            <button
              onClick={() => copyLink(shareGallery.slug)}
              className="text-[11px] font-semibold text-teal bg-transparent border-0 cursor-pointer tracking-[0.04em] uppercase flex-shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
