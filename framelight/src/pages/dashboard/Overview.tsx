import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGalleries } from '../../hooks/useGalleries'
import { Topbar } from '../../components/layout/Topbar'
import { Button } from '../../components/ui/Button'
import type { Gallery } from '../../types/database'

function GalleryCard({ gallery, onClick }: { gallery: Gallery; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    published: 'bg-ink/60 text-white/90',
    draft:     'bg-white/75 text-ink-mid',
    expired:   'bg-red/85 text-white',
  }
  const tag = statusColors[gallery.status] ?? statusColors.draft

  return (
    <div
      className="bg-white border border-border rounded-[14px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card hover:border-teal-pale group"
      onClick={onClick}
    >
      <div className="h-[185px] relative overflow-hidden bg-teal-pale">
        {gallery.cover_url ? (
          <img src={gallery.cover_url} alt={gallery.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-teal/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3.5">
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 rounded-md border border-white/30 bg-white/15 backdrop-blur-sm text-white text-[11px] font-medium tracking-[0.04em] hover:bg-white/28 transition-colors font-ui">
              Edit
            </button>
            <button className="px-3 py-1.5 rounded-md border border-white/30 bg-white/15 backdrop-blur-sm text-white text-[11px] font-medium tracking-[0.04em] hover:bg-white/28 transition-colors font-ui">
              View
            </button>
          </div>
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-[10px] font-semibold tracking-[0.07em] uppercase px-2.5 py-[3px] rounded-full backdrop-blur-sm ${tag}`}>
            {gallery.status}
          </span>
          {gallery.pin_enabled && (
            <span className="text-[10px] font-semibold tracking-[0.07em] uppercase px-2.5 py-[3px] rounded-full backdrop-blur-sm bg-teal/90 text-ink">
              PIN
            </span>
          )}
        </div>
      </div>
      <div className="px-[18px] pt-4 pb-[18px]">
        <div className="font-display text-[17px] font-medium text-ink mb-[3px]">{gallery.title}</div>
        <div className="text-[12px] text-ink-muted mb-3.5">{gallery.client_name ?? 'No client'} · {new Date(gallery.created_at).toLocaleDateString()}</div>
        <div className="flex items-center justify-between border-t border-teal-pale pt-3">
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-[12px] text-ink-mid">
              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {gallery.view_count}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button className="w-7 h-7 rounded-md border border-border bg-transparent cursor-pointer flex items-center justify-center text-ink-muted transition-all hover:border-teal hover:text-teal hover:bg-teal-pale">
              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
            <button className="w-7 h-7 rounded-md border border-border bg-transparent cursor-pointer flex items-center justify-center text-ink-muted transition-all hover:border-red hover:text-red hover:bg-pink">
              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Overview() {
  const { user, profile } = useAuth()
  const { galleries, loading } = useGalleries(user?.id)
  const navigate = useNavigate()

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

          {/* Tip banner */}
          <div className="bg-pink border border-pink-dark rounded-xl px-5 py-[18px] mb-8">
            <h4 className="font-display text-[16px] font-medium text-ink mb-1">💡 Pro tip</h4>
            <p className="text-[13px] text-ink-mid">Enable PIN protection on client galleries to keep sessions private and share links confidently.</p>
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
                <GalleryCard key={g.id} gallery={g} onClick={() => navigate(`/dashboard/gallery/${g.id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
