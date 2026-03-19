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

function GalleryCard({
  gallery,
  onEdit,
  onDelete,
  onShare,
}: {
  gallery: Gallery
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const expiryDays = gallery.expiry_date
    ? Math.ceil((new Date(gallery.expiry_date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div
      className="relative rounded-[18px] overflow-hidden cursor-pointer group bg-ink"
      style={{ aspectRatio: '3/4' }}
      onClick={() => window.open(`/g/${gallery.slug}`, '_blank')}
    >
      {gallery.cover_url ? (
        <img
          src={gallery.cover_url}
          alt={gallery.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06]"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink to-charcoal flex flex-col items-center justify-center gap-2">
          <svg className="w-7 h-7 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="text-[11px] text-white/25 tracking-[0.06em]">No cover yet</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(15,30,30,0.05)] via-[38%] to-[rgba(15,30,30,0.94)] pointer-events-none" />

      {/* Edit button — top left */}
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        className="absolute top-3 left-3 z-10 w-[30px] h-[30px] rounded-full bg-white/15 backdrop-blur-[8px] border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
        title="Edit gallery"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

      {/* 3-dot menu — top right */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          className="w-[30px] h-[30px] rounded-full bg-white/15 backdrop-blur-[8px] border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/28"
        >
          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        {menuOpen && (
          <div
            className="absolute top-[42px] right-0 bg-white rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(26,58,58,0.18),0_0_0_1px_rgba(26,58,58,0.06)] min-w-[155px] flex flex-col z-20"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-charcoal hover:bg-teal-pale transition-colors text-left"
              onClick={() => { window.open(`/g/${gallery.slug}`, '_blank'); setMenuOpen(false) }}
            >
              <svg className="w-[13px] h-[13px] text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View Gallery
            </button>
            <button
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-charcoal hover:bg-teal-pale transition-colors text-left"
              onClick={() => { onShare(); setMenuOpen(false) }}
            >
              <svg className="w-[13px] h-[13px] text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              Share Link
            </button>
            <button
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-charcoal hover:bg-teal-pale transition-colors text-left"
              onClick={() => { onEdit(); setMenuOpen(false) }}
            >
              <svg className="w-[13px] h-[13px] text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Details
            </button>
            <div className="h-px bg-border mx-0 my-0.5" />
            <button
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red hover:bg-[#fff0f0] transition-colors text-left"
              onClick={() => { onDelete(); setMenuOpen(false) }}
            >
              <svg className="w-[13px] h-[13px] text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Card content — bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-3.5 z-[2] flex flex-col gap-2">
        <div className="font-display text-[18px] font-normal text-white leading-[1.1]">{gallery.title}</div>
        <div className="text-[11px] text-white/50 font-light">
          {gallery.client_name ?? ''}
          {gallery.client_name && gallery.created_at ? ' · ' : ''}
          {new Date(gallery.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {/* Status pill */}
          {gallery.status === 'published' && !gallery.pin_enabled && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal/25 border border-teal/40 text-[10px] text-[#a8e6e3]">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Active
            </span>
          )}
          {gallery.status === 'expired' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(224,120,120,0.25)] border border-[rgba(224,120,120,0.4)] text-[10px] text-[#f5aaaa]">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              Expired
            </span>
          )}
          {gallery.pin_enabled && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/14 backdrop-blur-[10px] border border-white/15 text-[10px] text-white/85">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              PIN
            </span>
          )}
          {gallery.status === 'draft' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/14 backdrop-blur-[10px] border border-white/15 text-[10px] text-white/85">
              Draft
            </span>
          )}
          {/* Expiry pill */}
          {expiryDays !== null && expiryDays > 0 && expiryDays <= 30 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(232,164,74,0.25)] border border-[rgba(232,164,74,0.4)] text-[10px] text-[#f5cc80]">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {expiryDays}d left
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function GalleryRow({
  gallery,
  onDelete,
  onShare,
}: {
  gallery: Gallery
  onDelete: () => void
  onShare: () => void
}) {
  const expiryDays = gallery.expiry_date
    ? Math.ceil((new Date(gallery.expiry_date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 border-b border-teal-pale last:border-b-0 hover:bg-teal-pale/50 transition-colors cursor-pointer group"
      onClick={() => window.open(`/g/${gallery.slug}`, '_blank')}
    >
      {/* Thumb */}
      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 bg-ink">
        {gallery.cover_url ? (
          <img src={gallery.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ink to-charcoal flex items-center justify-center">
            <svg className="w-4 h-4 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-display text-[16px] font-normal text-ink leading-snug truncate">{gallery.title}</div>
        <div className="text-[12px] text-ink-muted mt-0.5 truncate">
          {gallery.client_name ?? ''}
          {gallery.client_name ? ' · ' : ''}
          {new Date(gallery.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        {gallery.status === 'published' && !gallery.pin_enabled && (
          <span className="px-2.5 py-1 rounded-full bg-teal/[0.12] text-teal text-[11px] font-medium">Active</span>
        )}
        {gallery.status === 'draft' && (
          <span className="px-2.5 py-1 rounded-full bg-ink/[0.07] text-ink-muted text-[11px] font-medium">Draft</span>
        )}
        {gallery.status === 'expired' && (
          <span className="px-2.5 py-1 rounded-full bg-red/[0.10] text-red text-[11px] font-medium">Expired</span>
        )}
        {gallery.pin_enabled && (
          <span className="ml-1.5 px-2.5 py-1 rounded-full bg-border/70 text-ink-muted text-[11px]">PIN</span>
        )}
        {expiryDays !== null && expiryDays > 0 && expiryDays <= 14 && (
          <span className="ml-1.5 px-2.5 py-1 rounded-full bg-amber/[0.12] text-amber text-[11px]">{expiryDays}d left</span>
        )}
      </div>

      {/* Views */}
      <div className="text-[12px] text-ink-muted flex-shrink-0 w-[60px] text-right">
        {gallery.view_count > 0 ? `${gallery.view_count} views` : ''}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => window.open(`/g/${gallery.slug}`, '_blank')}
          className="w-7 h-7 rounded-md bg-white border border-border flex items-center justify-center text-ink-muted hover:text-teal hover:border-teal transition-colors"
          title="View"
        >
          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </button>
        <button
          onClick={onShare}
          className="w-7 h-7 rounded-md bg-white border border-border flex items-center justify-center text-ink-muted hover:text-teal hover:border-teal transition-colors"
          title="Share"
        >
          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-md bg-white border border-border flex items-center justify-center text-ink-muted hover:text-red hover:border-red transition-colors"
          title="Delete"
        >
          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>
  )
}

export function Galleries() {
  const { user } = useAuth()
  const { galleries, loading, deleteGallery } = useGalleries(user?.id)
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null)
  const [copied, setCopied] = useState(false)
  const [gridVisible, setGridVisible] = useState(true)

  function animateFilterChange(fn: () => void) {
    setGridVisible(false)
    setTimeout(() => { fn(); setGridVisible(true) }, 160)
  }

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
      toast.show('Failed to delete gallery — try again or refresh the page', 'error')
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

  const filterLabels: Record<StatusFilter, string> = {
    all: 'All',
    published: 'Active',
    draft: 'Draft',
    expired: 'Expired',
  }

  const filterCounts: Record<StatusFilter, number> = {
    all: galleries.length,
    published: galleries.filter(g => g.status === 'published').length,
    draft: galleries.filter(g => g.status === 'draft').length,
    expired: galleries.filter(g => g.status === 'expired').length,
  }

  return (
    <div className="flex-1 flex flex-col md:overflow-hidden page-enter">
      <Topbar title="My Galleries" showNew />

      <main className="flex-1 md:overflow-y-auto">
        <div className="px-4 pt-5 pb-[88px] xs:px-5 md:p-8 md:pb-8">
          {/* Toolbar */}
          <div className="flex items-center gap-2.5 mb-6 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => animateFilterChange(() => setFilter(f))}
                  className={`flex items-center gap-1.5 px-4 py-[7px] rounded-full border font-ui text-[12.5px] font-medium cursor-pointer transition-all
                    ${filter === f
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink-mid border-border hover:bg-teal-pale hover:border-teal hover:text-teal'
                    }`}
                >
                  {filterLabels[f]}
                  <span className={`text-[10px] px-1.5 py-px rounded-full ${filter === f ? 'bg-white/20 text-white' : 'bg-border text-ink-muted'}`}>
                    {filterCounts[f]}
                  </span>
                </button>
              ))}
            </div>

            {/* Right side controls */}
            <div className="ml-auto flex items-center gap-2">
              <select
                value={sort}
                onChange={e => animateFilterChange(() => setSort(e.target.value))}
                className="px-3 py-[7px] rounded-lg border border-border bg-white font-ui text-[12.5px] text-ink outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="views">Most Views</option>
                <option value="alpha">Name A–Z</option>
              </select>

              {/* Grid / List toggle */}
              <div className="flex border border-border rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => animateFilterChange(() => setView('grid'))}
                  className={`w-8 h-[34px] flex items-center justify-center transition-colors ${view === 'grid' ? 'bg-ink text-white' : 'text-ink-muted hover:bg-teal-pale hover:text-ink'}`}
                  title="Grid view"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => animateFilterChange(() => setView('list'))}
                  className={`w-8 h-[34px] flex items-center justify-center transition-colors border-l border-border ${view === 'list' ? 'bg-ink text-white' : 'text-ink-muted hover:bg-teal-pale hover:text-ink'}`}
                  title="List view"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            view === 'grid' ? (
              <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3.5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white border border-border rounded-[18px] animate-pulse" style={{ aspectRatio: '3/4' }} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[72px] border-b border-teal-pale last:border-b-0 animate-pulse bg-white" />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-[18px] p-16 text-center">
              <div className="w-16 h-16 bg-teal-pale rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <p className="font-display text-[22px] font-light text-ink mb-2">No galleries found</p>
              <p className="text-[13px] text-ink-muted mb-5">Try a different filter or create a new gallery.</p>
              <Button variant="primary" onClick={() => navigate('/dashboard/new')}>Create Gallery</Button>
            </div>
          ) : view === 'grid' ? (
            <div
              className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3.5 transition-[opacity,transform] duration-[250ms]"
              style={{ opacity: gridVisible ? 1 : 0, transform: gridVisible ? 'translateY(0)' : 'translateY(8px)' }}
            >
              {filtered.map(g => (
                <GalleryCard
                  key={g.id}
                  gallery={g}
                  onEdit={() => navigate(`/dashboard/gallery/${g.id}`)}
                  onDelete={() => setDeleteId(g.id)}
                  onShare={() => setShareGallery(g)}
                />
              ))}
            </div>
          ) : (
            <div
              className="bg-white border border-border rounded-2xl overflow-hidden transition-[opacity,transform] duration-[250ms]"
              style={{ opacity: gridVisible ? 1 : 0, transform: gridVisible ? 'translateY(0)' : 'translateY(8px)' }}
            >
              {filtered.map(g => (
                <GalleryRow
                  key={g.id}
                  gallery={g}
                  onDelete={() => setDeleteId(g.id)}
                  onShare={() => setShareGallery(g)}
                />
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
