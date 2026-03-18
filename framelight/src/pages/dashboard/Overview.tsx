import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGalleries } from '../../hooks/useGalleries'
import { Topbar } from '../../components/layout/Topbar'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import type { Gallery } from '../../types/database'

function GalleryCard({
  gallery,
  onEdit,
  onDelete,
}: {
  gallery: Gallery
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="bg-white rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] group"
      onClick={onEdit}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-[12px] bg-[#e8eeee]" style={{ aspectRatio: '4/3' }}>
        {gallery.cover_url ? (
          <img
            src={gallery.cover_url}
            alt={gallery.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-teal/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}
        {/* Hover action buttons */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/g/${gallery.slug}`, '_blank') }}
            className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm border-0 cursor-pointer flex items-center justify-center text-ink/70 hover:text-teal transition-colors"
            title="View gallery"
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm border-0 cursor-pointer flex items-center justify-center text-ink/70 hover:text-red transition-colors"
            title="Delete gallery"
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>

      {/* Text */}
      <div className="pt-3 pb-1">
        <div className="font-display text-[20px] font-normal text-ink leading-snug">{gallery.title}</div>
        <div className="text-[14px] text-ink-muted mt-0.5">{gallery.client_name ?? gallery.layout}</div>
      </div>
    </div>
  )
}

export function Overview() {
  const { user, profile } = useAuth()
  const { galleries, loading, deleteGallery } = useGalleries(user?.id)
  const navigate = useNavigate()
  const toast = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  async function handleDelete() {
    if (!deleteId || deleteConfirm !== 'DELETE') return
    try {
      await deleteGallery(deleteId)
      toast.show('Gallery deleted')
    } catch {
      toast.show('Failed to delete gallery — try again or refresh the page', 'error')
    } finally {
      setDeleteId(null)
      setDeleteConfirm('')
    }
  }

  const activeCount = galleries.filter(g => g.status === 'published').length
  const totalViews  = galleries.reduce((s, g) => s + g.view_count, 0)
  const recent      = galleries.slice(0, 6)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Dashboard" showNew />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Hero */}
          <div className="bg-ink rounded-2xl px-10 py-9 mb-7 flex items-center justify-between overflow-hidden relative">
            <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(92,189,185,0.2)_0%,transparent_70%)]" />
            <div className="absolute -bottom-20 right-36 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(251,227,232,0.08)_0%,transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="font-display text-[34px] font-light text-white leading-tight mb-2">
                Good to see you,{' '}
                <em className="italic text-teal-light">{profile?.studio_name ?? 'Photographer'}</em>
              </h2>
              <p className="text-[14px] text-white/45 font-light">Ready to share something beautiful today?</p>
            </div>
            <div className="flex gap-2.5 relative z-10">
              <Button variant="teal" onClick={() => navigate('/dashboard/new')}>
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Gallery
              </Button>
              <Button
                variant="ghost"
                className="bg-white/[0.07] text-white/80 border border-white/15 hover:bg-white/13"
                onClick={() => navigate('/dashboard/galleries')}
              >
                View All
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Galleries', val: activeCount, sub: `${galleries.length} total`, accent: false },
              { label: 'Total Views', val: totalViews, sub: 'All time', accent: false },
              { label: 'Storage Used', val: `${((profile?.storage_used_bytes ?? 0) / 1e9).toFixed(1)} GB`, sub: 'of 5 GB', accent: true },
              { label: 'Downloads', val: '—', sub: 'Track soon', accent: false },
            ].map(stat => (
              <div
                key={stat.label}
                className={`border rounded-xl px-6 py-[22px] transition-shadow hover:shadow-[0_4px_20px_rgba(92,189,185,0.12)] ${stat.accent ? 'bg-teal-pale border-teal/30' : 'bg-white border-border'}`}
              >
                <div className="text-[11px] font-medium tracking-[0.09em] uppercase text-ink-muted mb-2.5 flex items-center justify-between">
                  {stat.label}
                </div>
                <div className={`font-display text-[38px] font-light leading-none mb-1 ${stat.accent ? 'text-teal' : 'text-ink'}`}>
                  {stat.val}
                </div>
                <div className="text-[12px] text-ink-muted">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Recent Galleries */}
          <div className="flex items-center justify-between mb-[18px]">
            <h3 className="font-display text-[20px] font-medium text-ink">Recent Galleries</h3>
            <button
              onClick={() => navigate('/dashboard/galleries')}
              className="text-[13px] text-teal font-medium cursor-pointer hover:underline bg-transparent border-0 p-0"
            >
              See all
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-[18px]">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-border rounded-[14px] h-[290px] animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-white border border-border rounded-[14px] p-12 text-center">
              <div className="w-16 h-16 bg-teal-pale rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <p className="font-display text-[22px] font-light text-ink mb-2">No galleries yet</p>
              <p className="text-[13px] text-ink-muted mb-5">Create your first gallery to get started.</p>
              <Button variant="teal" onClick={() => navigate('/dashboard/new')}>Create Gallery</Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[18px]">
              {recent.map(g => (
                <GalleryCard
                  key={g.id}
                  gallery={g}
                  onEdit={() => navigate(`/dashboard/gallery/${g.id}`)}
                  onDelete={() => setDeleteId(g.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

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
    </div>
  )
}
