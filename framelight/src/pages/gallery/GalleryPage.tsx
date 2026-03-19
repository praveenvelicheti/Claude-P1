import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/Toast'
import { downloadZip } from '../../lib/zip'
import { PinGate } from '../../components/gallery/PinGate'
import { Lightbox } from '../../components/gallery/Lightbox'
import { FavoritesBar } from '../../components/gallery/FavoritesBar'
import type { Gallery, Photo, Profile } from '../../types/database'

function getSessionToken() {
  let token = sessionStorage.getItem('fl_session')
  if (!token) {
    token = crypto.randomUUID()
    sessionStorage.setItem('fl_session', token)
  }
  return token
}

const GALLERY_THEMES = {
  framelight: { bg: '#ffffff', text: '#1a3a3a', muted: '#5a8e8c', border: '#ceecea', card: '#ebf6f5', cover: '#1a3a3a', navBg: 'rgba(255,255,255,0.96)', navShadow: '#ceecea', accent: '#5cbdb9' },
  dark:       { bg: '#141414', text: '#e0e0e0', muted: '#888888', border: '#2a2a2a', card: '#222222', cover: '#000000', navBg: 'rgba(20,20,20,0.96)',   navShadow: '#2a2a2a', accent: '#888888' },
  minimal:    { bg: '#f8f8f8', text: '#1a1a1a', muted: '#888888', border: '#e5e5e5', card: '#f0f0f0', cover: '#222222', navBg: 'rgba(248,248,248,0.96)', navShadow: '#e5e5e5', accent: '#777777' },
  terracotta: { bg: '#fdf0e8', text: '#3d1c04', muted: '#8b5e3c', border: '#e8b897', card: '#ffd5b2', cover: '#8b4513', navBg: 'rgba(253,240,232,0.96)', navShadow: '#e8b897', accent: '#d2691e' },
  lavender:   { bg: '#f3f0fa', text: '#2a1f4a', muted: '#6e5f9a', border: '#c9bfe8', card: '#e8e4f3', cover: '#4a4080', navBg: 'rgba(243,240,250,0.96)', navShadow: '#c9bfe8', accent: '#9b89c4' },
  gold:       { bg: '#fffdf0', text: '#1a1200', muted: '#7a6010', border: '#e8d78a', card: '#fdf5d0', cover: '#2c2000', navBg: 'rgba(255,253,240,0.96)', navShadow: '#e8d78a', accent: '#b8860b' },
}

export function GalleryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()
  const toast = useToast()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photographer, setPhotographer] = useState<Profile | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expired, setExpired] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [dlFavs, setDlFavs] = useState(false)
  const [dlAll, setDlAll] = useState(false)
  const [dlMenuOpen, setDlMenuOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const sessionToken = getSessionToken()
  const coverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    loadGallery()
  }, [slug])

  useEffect(() => {
    if (!photos.length || loading) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.01 }
    )
    document.querySelectorAll('.photo-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [photos, loading])

  // Admin bypass: let the photographer skip the PIN when logged in as the owner
  useEffect(() => {
    if (authLoading || !gallery) return
    if (gallery.admin_bypass && user?.id === gallery.photographer_id) {
      setUnlocked(true)
    }
  }, [gallery, user, authLoading])

  useEffect(() => {
    function handleScroll() {
      const cover = coverRef.current
      if (!cover) return
      const bottom = cover.getBoundingClientRect().bottom
      setNavScrolled(bottom <= 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  async function loadGallery() {
    const { data: gal, error } = await db
      .from('galleries')
      .select('*')
      .eq('slug', slug!)
      .eq('status', 'published')
      .single()

    if (error || !gal) { setNotFound(true); setLoading(false); return }
    const gallery = gal as Gallery

    // Enforce expiry date
    if (gallery.expiry_date && new Date(gallery.expiry_date) < new Date()) {
      setExpired(true); setLoading(false); return
    }

    setGallery(gallery)

    db.from('galleries').update({ view_count: (gallery.view_count ?? 0) + 1 }).eq('id', gallery.id)

    const { data: prof } = await db.from('profiles').select('*').eq('id', gallery.photographer_id).single()
    if (prof) setPhotographer(prof as Profile)

    const { data: photoData } = await db.from('photos').select('*').eq('gallery_id', gallery.id).order('position')
    setPhotos((photoData ?? []) as Photo[])

    const { data: favData } = await db.from('favorites').select('photo_id').eq('gallery_id', gallery.id).eq('session_token', sessionToken)
    if (favData) setFavorites(new Set((favData as Array<{ photo_id: string }>).map(f => f.photo_id)))

    const pinUnlocked = sessionStorage.getItem(`pin_${gallery.id}`)
    if (!gallery.pin_enabled || pinUnlocked) setUnlocked(true)

    setLoading(false)
  }

  async function toggleFavorite(photoId: string) {
    if (!gallery) return
    if (favorites.has(photoId)) {
      setFavorites(prev => { const s = new Set(prev); s.delete(photoId); return s })
      await db.from('favorites').delete()
        .eq('gallery_id', gallery.id).eq('session_token', sessionToken).eq('photo_id', photoId)
    } else {
      setFavorites(prev => new Set([...prev, photoId]))
      await db.from('favorites').insert({ gallery_id: gallery.id, session_token: sessionToken, photo_id: photoId })
    }
  }

  async function downloadPhoto(photo: Photo) {
    if (!gallery) return
    db.from('downloads').insert({ gallery_id: gallery.id, photo_id: photo.id, session_token: sessionToken, is_bulk: false })
    try {
      const res = await fetch(photo.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename ?? 'photo.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {
      window.open(photo.url, '_blank')
    }
  }

  async function downloadAll() {
    if (!gallery || dlAll) return
    setDlAll(true)
    db.from('downloads').insert({ gallery_id: gallery.id, session_token: sessionToken, is_bulk: true })
    try {
      await downloadZip(photos.map(p => ({ url: p.url, filename: p.filename ?? undefined })), `${gallery.title}.zip`)
    } catch (err) {
      console.error('[downloadAll]', err)
      toast.show('Download failed — please try again', 'error')
    } finally {
      setDlAll(false)
    }
  }

  async function downloadFavorites() {
    if (!gallery || dlFavs) return
    setDlFavs(true)
    const favPhotos = photos.filter(p => favorites.has(p.id))
    try {
      await downloadZip(favPhotos.map(p => ({ url: p.url, filename: p.filename ?? undefined })), `${gallery.title} - Favorites.zip`)
    } finally { setDlFavs(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-[3px] border-[#aaa] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-ui">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-full bg-[#fff3e0] border border-[#f0c080] flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-[#b8860b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="font-display text-[28px] font-light text-ink mb-2">Gallery Expired</div>
          <p className="text-[14px] text-[#888]">This gallery is no longer available. Please contact the photographer for access.</p>
        </div>
      </div>
    )
  }

  if (notFound || !gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-ui">
        <div className="text-center">
          <div className="font-display text-[32px] font-light text-ink mb-2">Gallery not found</div>
          <p className="text-[14px] text-[#888]">This gallery may have expired or the link is incorrect.</p>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return <PinGate gallery={gallery} onUnlock={() => setUnlocked(true)} />
  }

  const formattedDate = new Date(gallery.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  const photographerName = photographer?.studio_name ?? ''
  const theme = GALLERY_THEMES[(gallery.theme ?? 'framelight') as keyof typeof GALLERY_THEMES] ?? GALLERY_THEMES.framelight
  const layout = gallery.layout ?? 'masonry'
  const cols = gallery.grid_cols ?? 3
  const gutter = gallery.grid_gutter ?? 8

  const displayedPhotos = showFavoritesOnly ? photos.filter(p => favorites.has(p.id)) : photos

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2200)
    })
  }

  // Shared hover overlay rendered inside each photo card
  function PhotoActions({ photo, isFav }: { photo: Photo; isFav: boolean }) {
    return (
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms] flex items-end justify-end p-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }}
      >
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          {gallery!.favorites_enabled && (
            <button
              onClick={() => toggleFavorite(photo.id)}
              className={`w-8 h-8 rounded-full bg-white/90 border-0 cursor-pointer flex items-center justify-center transition-all hover:bg-white hover:scale-[1.08] ${isFav ? 'text-[#d45f7a]' : 'text-ink'}`}
            >
              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </button>
          )}
          {gallery!.downloads_enabled && (
            <button
              onClick={() => downloadPhoto(photo)}
              className="w-8 h-8 rounded-full bg-white/90 border-0 cursor-pointer flex items-center justify-center text-ink transition-all hover:bg-white hover:scale-[1.08]"
            >
              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-ui" style={{ backgroundColor: theme.bg, color: theme.text, overflowX: 'hidden' }}>
      <style>{`
        @keyframes coverZoom { from { transform: scale(1.06); } to { transform: scale(1.0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scrollPulse { 0%,100%{opacity:0.4;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.15)} }
        @keyframes lbFade { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
      `}</style>

      {/* ── Floating Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[200] h-[54px] flex items-center transition-all duration-350"
        style={{
          padding: '0 clamp(16px, 4vw, 48px)',
          ...(navScrolled ? { backgroundColor: theme.navBg, backdropFilter: 'blur(18px)', boxShadow: `0 1px 0 ${theme.navShadow}` } : {}),
        }}
      >
        {/* Left: logo + photographer + separator + gallery name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {(photographer?.logo_url || photographer?.logo_url_light) ? (() => {
            const navLogoUrl = navScrolled
              ? (photographer.logo_url || photographer.logo_url_light)
              : (photographer.logo_url_light || photographer.logo_url)
            return navLogoUrl ? (
              <img src={navLogoUrl} alt="" className="h-7 max-w-[120px] object-contain flex-shrink-0 transition-all" />
            ) : null
          })() : null}
          {photographerName && (
            <span className="font-display text-[16px] font-normal whitespace-nowrap tracking-[0.03em] transition-colors"
              style={{ color: navScrolled ? theme.text : 'rgba(255,255,255,0.9)' }}>
              {photographerName}
            </span>
          )}
          {photographerName && (
            <div className="w-px h-3.5 flex-shrink-0 transition-colors"
              style={{ backgroundColor: navScrolled ? theme.border : 'rgba(255,255,255,0.25)' }} />
          )}
          <span className="text-[12px] font-light tracking-[0.06em] italic whitespace-nowrap overflow-hidden text-ellipsis transition-colors"
            style={{ color: navScrolled ? theme.muted : 'rgba(255,255,255,0.55)' }}>
            {gallery.title}
          </span>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Favorites */}
          {gallery.favorites_enabled && (
            <div className="relative">
              <button
                onClick={() => setShowFavoritesOnly(o => !o)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center border transition-all"
                style={showFavoritesOnly
                  ? { borderColor: '#d45f7a', backgroundColor: '#d45f7a', color: '#fff' }
                  : navScrolled
                    ? { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }
                    : { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.85)' }
                }
                title={showFavoritesOnly ? 'Show all photos' : 'Show favourites only'}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                {favorites.size > 0 && !showFavoritesOnly && (
                  <span className="absolute -top-[3px] -right-[3px] w-[15px] h-[15px] rounded-full text-white text-[8px] font-semibold flex items-center justify-center border-2 border-white"
                    style={{ backgroundColor: theme.accent }}>
                    {favorites.size}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Slideshow */}
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center border transition-all"
            style={navScrolled
              ? { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }
              : { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.85)' }
            }
            title="Slideshow"
            onClick={() => photos.length > 0 && setLightboxIdx(0)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>

          {/* Share */}
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center border transition-all"
            style={navScrolled
              ? { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }
              : { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.85)' }
            }
            title="Share"
            onClick={() => setShareOpen(true)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>

          {/* Download dropdown */}
          {gallery.downloads_enabled && (
            <div className="relative">
              <button
                onClick={() => setDlMenuOpen(o => !o)}
                disabled={dlAll || dlFavs}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[18px] border font-ui text-[11.5px] font-normal tracking-[0.07em] uppercase cursor-pointer transition-all disabled:opacity-60 whitespace-nowrap"
                style={navScrolled
                  ? { backgroundColor: theme.accent, borderColor: theme.accent, color: '#fff' }
                  : { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.9)' }
                }
              >
                {(dlAll || dlFavs) ? (
                  <svg className="w-[13px] h-[13px] animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                <span className="hidden sm:inline">Download</span>
                <svg className="w-[10px] h-[10px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {dlMenuOpen && (
                <div
                  className="absolute top-[44px] right-0 bg-white rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(26,58,58,0.18),0_0_0_1px_rgba(26,58,58,0.08)] min-w-[175px] flex flex-col z-[300]"
                  onMouseLeave={() => setDlMenuOpen(false)}
                >
                  {/* All Photos — only shown when zip is enabled */}
                  {gallery.zip_enabled && (
                    <button
                      onClick={() => { setDlMenuOpen(false); downloadAll() }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] text-charcoal hover:bg-teal-pale transition-colors text-left font-ui"
                    >
                      <svg className="w-[13px] h-[13px] text-teal flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      All Photos
                    </button>
                  )}
                  {gallery.favorites_enabled && favorites.size > 0 && (
                    <button
                      onClick={() => { setDlMenuOpen(false); downloadFavorites() }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] text-charcoal hover:bg-teal-pale transition-colors text-left font-ui border-t border-[#f0f0f0]"
                    >
                      <svg className="w-[13px] h-[13px] text-[#d45f7a] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      Favourites ({favorites.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── Cover — 100vh ── */}
      <div
        ref={coverRef}
        className="relative w-screen overflow-hidden"
        style={{ height: 'clamp(380px, 56.25vw, 100vh)', backgroundColor: theme.cover }}
      >
        {gallery.cover_url && (
          <img
            src={gallery.cover_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_30%] block"
            style={{ animation: 'coverZoom 22s ease-in-out infinite alternate', transformOrigin: 'center center' }}
          />
        )}
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.2) 100%), linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)' }}
        />

        {/* Centered title */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
          {/* Brand logo — prefer light/white version on dark cover */}
          {(photographer?.logo_url_light || photographer?.logo_url) && (
            <div style={{ animation: 'fadeUp 1s ease 0.1s both' }} className="mb-6">
              <img
                src={photographer.logo_url_light || photographer.logo_url!}
                alt=""
                style={{ height: 'clamp(44px, 7vw, 80px)', maxWidth: 'clamp(160px, 28vw, 320px)' }}
                className="object-contain opacity-85"
              />
            </div>
          )}
          {photographerName && (
            <div style={{ fontSize: 'clamp(11px, 1.6vw, 15px)', animation: 'fadeUp 1s ease 0.2s both' }}
              className="font-ui font-normal tracking-[0.22em] uppercase text-white/85 mb-[18px]">
              {photographerName}
            </div>
          )}
          <h1
            className="font-display font-light text-white leading-[0.95] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(44px, 9vw, 100px)', animation: 'fadeUp 1s ease 0.4s both' }}
          >
            {gallery.title}
          </h1>
          <div style={{ fontSize: 'clamp(11px, 1.4vw, 13px)', animation: 'fadeUp 1s ease 0.6s both' }}
            className="font-ui font-normal tracking-[0.18em] uppercase text-white/50 mt-[22px]">
            {formattedDate}
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-9 left-0 right-0 flex flex-col items-center gap-2 text-white/45 cursor-pointer hover:text-white/80 transition-colors"
          style={{ animation: 'fadeUp 1s ease 1s both' }}
          onClick={() => document.getElementById('gallery-body')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-[9px] tracking-[0.2em] uppercase font-normal">Scroll</span>
          <div className="w-px h-10"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.5))', animation: 'scrollPulse 2s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* ── Gallery body ── */}
      <div id="gallery-body" style={{ backgroundColor: theme.bg }}>

        {/* Favorites bar */}
        {gallery.favorites_enabled && (
          <FavoritesBar
            count={favorites.size}
            onDownloadFavorites={downloadFavorites}
            onClearFavorites={() => setFavorites(new Set())}
            downloading={dlFavs}
          />
        )}

        {/* Sets nav */}
        <div className="flex items-center justify-center overflow-x-auto"
          style={{ padding: '0 clamp(16px,4vw,48px)', borderBottom: `1px solid ${theme.border}` }}>
          <button
            onClick={() => setShowFavoritesOnly(false)}
            className="px-[22px] py-4 text-[12px] font-medium tracking-[0.08em] uppercase border-b-2 -mb-px whitespace-nowrap bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer font-ui"
            style={{ color: showFavoritesOnly ? theme.muted : theme.text, borderBottomColor: showFavoritesOnly ? 'transparent' : theme.accent }}>
            All Photos
          </button>
          {gallery.favorites_enabled && favorites.size > 0 && (
            <button
              onClick={() => setShowFavoritesOnly(true)}
              className="px-[22px] py-4 text-[12px] font-medium tracking-[0.08em] uppercase border-b-2 -mb-px whitespace-nowrap bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer font-ui flex items-center gap-1.5"
              style={{ color: showFavoritesOnly ? theme.text : theme.muted, borderBottomColor: showFavoritesOnly ? theme.accent : 'transparent' }}>
              <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#d45f7a' }}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              Favourites
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: '#d45f7a' }}>{favorites.size}</span>
            </button>
          )}
        </div>

        {/* ── Photo grid — layout-aware ── */}
        {layout === 'masonry' && (
          <div
            id="photo-grid"
            style={{
              padding: `clamp(12px,2vw,24px) clamp(8px,2vw,24px)`,
              columns: cols,
              columnGap: `${gutter}px`,
            }}
          >
            <style>{`
              @media (max-width: 900px) { #photo-grid { columns: ${Math.min(2, cols)} !important; padding-left: 0 !important; padding-right: 0 !important; } }
              @media (max-width: 500px) { #photo-grid { columns: 2 !important; padding: 0 !important; } }
            `}</style>
            {displayedPhotos.map((photo, idx) => (
              <div key={photo.id}
                className="photo-reveal break-inside-avoid relative cursor-pointer overflow-hidden block group"
                style={{ marginBottom: `${gutter}px`, backgroundColor: theme.card }}
                onClick={() => setLightboxIdx(idx)}
              >
                <img src={photo.thumb_url} alt={photo.filename ?? ''}
                  className="w-full block transition-transform duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <PhotoActions photo={photo} isFav={favorites.has(photo.id)} />
              </div>
            ))}
          </div>
        )}

        {layout === 'square' && (
          <div
            id="photo-grid"
            style={{
              padding: `clamp(12px,2vw,24px) clamp(8px,2vw,24px)`,
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: `${gutter}px`,
            }}
          >
            <style>{`
              @media (max-width: 900px) { #photo-grid { grid-template-columns: repeat(${Math.min(2, cols)}, 1fr) !important; padding-left: 0 !important; padding-right: 0 !important; } }
              @media (max-width: 500px) { #photo-grid { grid-template-columns: repeat(2, 1fr) !important; padding: 0 !important; gap: ${Math.min(gutter, 4)}px !important; } }
            `}</style>
            {displayedPhotos.map((photo, idx) => (
              <div key={photo.id}
                className="photo-reveal relative cursor-pointer overflow-hidden group"
                style={{ aspectRatio: '1', backgroundColor: theme.card }}
                onClick={() => setLightboxIdx(idx)}
              >
                <img src={photo.thumb_url} alt={photo.filename ?? ''}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <PhotoActions photo={photo} isFav={favorites.has(photo.id)} />
              </div>
            ))}
          </div>
        )}

        {layout === 'justified' && (
          <div
            id="photo-grid"
            style={{
              padding: `clamp(12px,2vw,24px) clamp(8px,2vw,24px)`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: `${gutter}px`,
            }}
          >
            <style>{`
              @media (max-width: 500px) { #photo-grid { padding: 0 !important; gap: ${Math.min(gutter, 4)}px !important; } }
              @media (max-width: 500px) { #photo-grid > * { height: 160px !important; } }
            `}</style>
            {displayedPhotos.map((photo, idx) => {
              const ratio = (photo.width && photo.height) ? photo.width / photo.height : 1.5
              return (
                <div key={photo.id}
                  className="photo-reveal relative cursor-pointer overflow-hidden group"
                  style={{ height: '220px', flex: `${ratio} 1 ${Math.round(ratio * 220)}px`, backgroundColor: theme.card }}
                  onClick={() => setLightboxIdx(idx)}
                >
                  <img src={photo.thumb_url} alt={photo.filename ?? ''}
                    className="w-full h-full object-cover transition-transform duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <PhotoActions photo={photo} isFav={favorites.has(photo.id)} />
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <footer
          className="flex flex-col items-center gap-3"
          style={{
            padding: `clamp(28px,4vw,48px) clamp(16px,4vw,48px)`,
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: theme.bg,
          }}
        >
          <div className="font-display text-[18px] font-light tracking-[0.06em]" style={{ color: theme.text }}>
            {photographerName && (
              <>{photographerName} <em className="italic" style={{ color: theme.accent }}>Photography</em></>
            )}
          </div>
          <div className="text-[11px] tracking-[0.08em]" style={{ color: theme.muted }}>
            Delivered with{' '}
            <span className="font-display text-[13px] font-medium" style={{ color: theme.text }}>
              Frame<em className="italic" style={{ color: theme.accent }}>light</em>
            </span>
          </div>
        </footer>
      </div>

      {/* Favourites empty state */}
      {showFavoritesOnly && favorites.size === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: theme.muted }}>
          <svg className="w-10 h-10 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <p className="text-[13px] tracking-[0.05em]">No favourites yet — tap the heart on any photo</p>
        </div>
      )}

      {/* Share dialog */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full sm:w-auto sm:min-w-[360px] sm:max-w-[440px] rounded-t-2xl sm:rounded-2xl overflow-hidden font-ui"
            style={{ backgroundColor: theme.bg, boxShadow: '0 24px 64px rgba(0,0,0,0.28)', border: `1px solid ${theme.border}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <span className="font-display text-[17px] font-light tracking-[0.02em]" style={{ color: theme.text }}>Share Gallery</span>
              <button onClick={() => setShareOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent" style={{ color: theme.muted }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Copy link */}
            <div className="px-5 pt-4 pb-3">
              <p className="text-[10.5px] tracking-[0.1em] uppercase mb-2.5" style={{ color: theme.muted }}>Gallery link</p>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
                <span className="flex-1 text-[12px] truncate select-all" style={{ color: theme.muted }}>{window.location.href}</span>
                <button
                  onClick={copyShareLink}
                  className="flex-shrink-0 px-3 py-1 rounded-lg text-[11px] font-medium tracking-[0.05em] uppercase transition-all cursor-pointer border-0"
                  style={{ backgroundColor: linkCopied ? '#22c55e' : theme.accent, color: '#fff' }}
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Social share */}
            <div className="px-5 pb-5 pt-2">
              <p className="text-[10.5px] tracking-[0.1em] uppercase mb-3" style={{ color: theme.muted }}>Share via</p>
              <div className="grid grid-cols-4 gap-2.5">
                {/* WhatsApp */}
                <a href={`https://wa.me/?text=${encodeURIComponent(gallery.title + ' — ' + window.location.href)}`} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all no-underline cursor-pointer"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.85L0 24l6.335-1.527A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.011-1.371l-.36-.213-3.727.898.927-3.638-.234-.373A9.776 9.776 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/></svg>
                  <span className="text-[10px] tracking-[0.04em]" style={{ color: theme.muted }}>WhatsApp</span>
                </a>
                {/* Facebook */}
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all no-underline cursor-pointer"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span className="text-[10px] tracking-[0.04em]" style={{ color: theme.muted }}>Facebook</span>
                </a>
                {/* X / Twitter */}
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(gallery.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all no-underline cursor-pointer"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: theme.text }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span className="text-[10px] tracking-[0.04em]" style={{ color: theme.muted }}>X</span>
                </a>
                {/* Email */}
                <a href={`mailto:?subject=${encodeURIComponent(gallery.title)}&body=${encodeURIComponent('Check out this gallery: ' + window.location.href)}`}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all no-underline cursor-pointer"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: theme.accent }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span className="text-[10px] tracking-[0.04em]" style={{ color: theme.muted }}>Email</span>
                </a>
              </div>
            </div>

            {/* Bottom safe-area spacer on mobile */}
            <div className="h-safe-bottom sm:hidden" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onDownload={downloadPhoto}
        />
      )}
    </div>
  )
}
