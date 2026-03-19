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

      {/* Edit button — top left, hover reveal */}
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        className="absolute top-3 left-3 z-10 w-[30px] h-[30px] rounded-full bg-white/15 backdrop-blur-[8px] border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
        title="Edit gallery"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

      {/* 3-dot menu — top right, hover reveal */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          className="w-[30px] h-[30px] rounded-full bg-white/15 backdrop-blur-[8px] border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/28"
          title="More options"
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

export function Overview() {
  const { user, profile } = useAuth()
  const { galleries, totalPhotoCount, loading, deleteGallery } = useGalleries(user?.id)
  const navigate = useNavigate()
  const toast = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null)
  const [copied, setCopied] = useState(false)

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

  const activeCount  = galleries.filter(g => g.status === 'published').length
  const totalViews   = galleries.reduce((s, g) => s + g.view_count, 0)
  const totalPhotos  = totalPhotoCount
  const recent       = galleries.slice(0, 3)

  const now = Date.now()
  const expiringSoon = galleries.filter(g => {
    if (!g.expiry_date) return false
    const days = Math.ceil((new Date(g.expiry_date).getTime() - now) / 86400000)
    return days > 0 && days <= 30
  })

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (profile?.studio_name ?? 'there').split(' ')[0]

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const stats = [
    {
      label: 'Active Galleries',
      val: activeCount,
      sub: `${galleries.length} total`,
      trend: 'up',
      featured: true,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      ),
    },
    {
      label: 'Total Photos',
      val: totalPhotos.toLocaleString(),
      sub: 'Across all galleries',
      trend: null,
      featured: false,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
    },
    {
      label: 'Client Views',
      val: totalViews.toLocaleString(),
      sub: 'All time',
      trend: 'up',
      featured: false,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      ),
    },
    {
      label: 'Downloads',
      val: '—',
      sub: expiringSoon.length > 0 ? `${expiringSoon.length} expiring soon` : 'No expirations soon',
      trend: expiringSoon.length > 0 ? 'warn' : null,
      featured: false,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="flex-1 flex flex-col md:overflow-hidden page-enter">
      <Topbar title="Dashboard" showNew />

      <main className="flex-1 md:overflow-y-auto">
        <div className="px-4 pt-5 pb-[88px] xs:px-5 md:p-8 md:pb-8">

          {/* ── Greeting header ── */}
          <div className="flex items-end justify-between mb-6 gap-4 flex-wrap md:flex-nowrap">
            <div>
              <div
                className="text-[10.5px] font-normal tracking-[0.18em] uppercase text-ink-muted mb-1.5"
                style={{ animation: 'fadeUp 0.5s ease 0.05s both' }}
              >
                {today}
              </div>
              <div
                className="font-display text-[30px] md:text-[32px] lg:text-[40px] font-light text-ink leading-none tracking-[-0.01em]"
                style={{ animation: 'fadeUp 0.6s ease 0.12s both' }}
              >
                {greeting}, <em className="italic text-teal">{firstName}.</em>
              </div>
              <div
                className="text-[13px] text-ink-muted mt-1.5 flex items-center gap-2"
                style={{ animation: 'fadeUp 0.5s ease 0.2s both' }}
              >
                {galleries.length > 0 && (
                  <>
                    <span>{activeCount} active {activeCount === 1 ? 'gallery' : 'galleries'}</span>
                    {expiringSoon.length > 0 && (
                      <>
                        <span className="w-[3px] h-[3px] rounded-full bg-border inline-block" />
                        <span>{expiringSoon.length} expiring soon</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2.5 flex-shrink-0" style={{ animation: 'fadeUp 0.5s ease 0.28s both' }}>
              <button
                onClick={() => navigate('/dashboard/galleries')}
                className="flex items-center gap-1.5 px-[18px] py-2.5 rounded-[10px] bg-white text-charcoal border border-border text-[13px] font-medium cursor-pointer hover:border-teal hover:text-teal hover:bg-teal-pale transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
                All Galleries
              </button>
              <Button variant="primary" onClick={() => navigate('/dashboard/new')}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Gallery
              </Button>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3.5 mb-5 md:mb-7">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                style={{ animation: `slideUp 0.5s ease ${0.18 + i * 0.06}s both` }}
                className={`relative overflow-hidden border rounded-2xl px-[22px] pt-[22px] pb-[18px] transition-all duration-[220ms] cursor-default
                  before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-tl-[2px] before:rounded-tr-[2px]
                  before:bg-gradient-to-r before:from-teal before:to-teal-light before:scale-x-0 before:origin-left before:transition-transform before:duration-300
                  hover:before:scale-x-100
                  ${stat.featured
                    ? 'bg-ink border-ink hover:shadow-[0_8px_28px_rgba(26,58,58,0.25)]'
                    : 'bg-white border-border hover:-translate-y-[2px] hover:shadow-[0_8px_28px_rgba(92,189,185,0.1)] hover:border-teal'
                  }`}
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`text-[10.5px] font-medium tracking-[0.1em] uppercase ${stat.featured ? 'text-white/40' : 'text-ink-muted'}`}>
                    {stat.label}
                  </div>
                  <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center ${stat.featured ? 'bg-teal/[0.18] text-teal-light' : 'bg-teal-pale text-teal'}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className={`font-display text-[34px] xs:text-[38px] md:text-[44px] font-light leading-none mb-1.5 ${stat.featured ? 'text-white' : 'text-ink'}`}>
                  {stat.val}
                </div>
                <div className={`text-[11.5px] flex items-center gap-1
                  ${stat.trend === 'up' ? (stat.featured ? 'text-teal-light' : 'text-[#5a9a6a]') : ''}
                  ${stat.trend === 'warn' ? 'text-amber' : ''}
                  ${!stat.trend ? (stat.featured ? 'text-white/38' : 'text-ink-muted') : ''}
                `}>
                  {stat.trend === 'up' && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                  )}
                  {stat.trend === 'warn' && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  )}
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── Two-col layout ── */}
          <div className="grid gap-5 md:gap-6 grid-cols-1 lg:grid-cols-[1fr_290px]">

            {/* LEFT — recent gallery cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-[21px] font-normal text-ink tracking-[0.01em]">
                  Recent <em className="italic">Galleries</em>
                </h3>
                <button
                  onClick={() => navigate('/dashboard/galleries')}
                  className="text-[12.5px] text-teal font-medium cursor-pointer hover:underline bg-transparent border-0 p-0"
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white border border-border rounded-[18px] animate-pulse" style={{ aspectRatio: '3/4' }} />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="bg-white border border-border rounded-[18px] p-12 text-center">
                  <div className="w-16 h-16 bg-teal-pale rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                    </svg>
                  </div>
                  <p className="font-display text-[22px] font-light text-ink mb-2">No galleries yet</p>
                  <p className="text-[13px] text-ink-muted mb-5">Create your first gallery to get started.</p>
                  <Button variant="primary" onClick={() => navigate('/dashboard/new')}>Create Gallery</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3.5">
                  {recent.map((g, i) => (
                    <div key={g.id} style={{ animation: `slideUp 0.5s ease ${0.38 + i * 0.06}s both` }}>
                    <GalleryCard
                      gallery={g}
                      onEdit={() => navigate(`/dashboard/gallery/${g.id}`)}
                      onDelete={() => setDeleteId(g.id)}
                      onShare={() => setShareGallery(g)}
                    />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — panels */}
            <div>

              {/* Expiring Soon */}
              {expiringSoon.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-[21px] font-normal text-ink">Expiring Soon</h3>
                  </div>
                  <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
                    {expiringSoon.slice(0, 3).map(g => {
                      const days = Math.ceil((new Date(g.expiry_date!).getTime() - now) / 86400000)
                      const isCrit = days <= 7
                      return (
                        <div
                          key={g.id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-teal-pale last:border-b-0 hover:bg-teal-pale transition-colors cursor-pointer"
                          onClick={() => navigate(`/dashboard/gallery/${g.id}`)}
                        >
                          {g.cover_url ? (
                            <img src={g.cover_url} alt="" className="w-[38px] h-[38px] rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-[38px] h-[38px] rounded-lg bg-teal-pale flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-ink truncate">{g.title}</div>
                            <div className={`text-[11px] mt-0.5 ${isCrit ? 'text-red font-medium' : 'text-amber'}`}>
                              Expires in {days} day{days !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <button
                            className={`px-2.5 py-1 rounded-[7px] text-[10.5px] font-medium flex-shrink-0 border cursor-pointer transition-all
                              ${isCrit
                                ? 'bg-red/[0.12] text-[#c05050] border-red/30 hover:bg-red/[0.22]'
                                : 'bg-amber/[0.12] text-[#a06010] border-amber/30 hover:bg-amber/[0.22]'
                              }`}
                            onClick={e => { e.stopPropagation(); toast.show('Reminder sent!') }}
                          >
                            Remind
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Quick Actions */}
              <div className="flex items-center justify-between mb-4" style={{ marginTop: expiringSoon.length > 0 ? 0 : 0 }}>
                <h3 className="font-display text-[21px] font-normal text-ink">Quick Actions</h3>
              </div>
              <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
                {[
                  {
                    ico: 'teal',
                    label: 'Create New Gallery',
                    sub: 'Upload photos & share with clients',
                    action: () => navigate('/dashboard/new'),
                    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
                  },
                  {
                    ico: 'pink',
                    label: 'Share a Gallery',
                    sub: 'Copy link or email client',
                    action: () => navigate('/dashboard/galleries'),
                    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
                  },
                  {
                    ico: 'ink',
                    label: 'Storage & Plan',
                    sub: `${((profile?.storage_used_bytes ?? 0) / 1e9).toFixed(1)} GB used`,
                    action: () => navigate('/dashboard/settings'),
                    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
                  },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-3 px-4 py-3 border-b border-teal-pale last:border-b-0 hover:bg-teal-pale transition-colors w-full text-left bg-transparent border-0 cursor-pointer font-ui"
                    style={{ borderBottom: '1px solid var(--color-border, #ceecea)' }}
                  >
                    <div className={`w-8 h-8 rounded-[9px] flex-shrink-0 flex items-center justify-center
                      ${item.ico === 'teal' ? 'bg-teal/[0.14] text-teal' : ''}
                      ${item.ico === 'pink' ? 'bg-pink/90 text-[#c0506a]' : ''}
                      ${item.ico === 'ink' ? 'bg-ink/[0.07] text-ink' : ''}
                    `}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-charcoal font-normal">{item.label}</div>
                      <div className="text-[10.5px] text-ink-muted mt-px">{item.sub}</div>
                    </div>
                    <svg className="w-[13px] h-[13px] text-border flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-[21px] font-normal text-ink">Activity</h3>
              </div>
              <div className="bg-white border border-border rounded-2xl overflow-hidden">
                {galleries.slice(0, 3).length === 0 ? (
                  <div className="px-4 py-6 text-center text-[13px] text-ink-muted">No activity yet</div>
                ) : (
                  galleries.slice(0, 4).map((g, i) => (
                    <div key={g.id} className={`flex items-start gap-3 px-4 py-3 ${i < Math.min(galleries.length, 4) - 1 ? 'border-b border-teal-pale' : ''}`}>
                      <div className="w-[30px] h-[30px] rounded-full bg-teal/[0.14] text-teal flex-shrink-0 flex items-center justify-center mt-px">
                        <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-charcoal leading-[1.45]">
                          <strong className="text-ink font-medium">{g.client_name ?? g.title}</strong> gallery viewed
                        </div>
                        <div className="text-[10px] text-ink-muted mt-0.5">
                          {g.view_count} total view{g.view_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
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
