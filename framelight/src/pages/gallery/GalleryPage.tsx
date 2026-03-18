import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
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

export function GalleryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photographer, setPhotographer] = useState<Profile | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [dlFavs, setDlFavs] = useState(false)
  const [dlAll, setDlAll] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const sessionToken = getSessionToken()
  const coverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    loadGallery()
  }, [slug])

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

  function downloadPhoto(photo: Photo) {
    if (!gallery) return
    db.from('downloads').insert({ gallery_id: gallery.id, photo_id: photo.id, session_token: sessionToken, is_bulk: false })
    const a = document.createElement('a')
    a.href = photo.url
    a.download = photo.filename ?? 'photo.jpg'
    a.target = '_blank'
    a.click()
  }

  async function downloadAll() {
    if (!gallery || dlAll) return
    setDlAll(true)
    db.from('downloads').insert({ gallery_id: gallery.id, session_token: sessionToken, is_bulk: true })
    try {
      await downloadZip(photos.map(p => ({ url: p.url, filename: p.filename ?? undefined })), `${gallery.title}.zip`)
    } finally { setDlAll(false) }
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

  return (
    <div className="min-h-screen bg-white font-ui" style={{ overflowX: 'hidden' }}>
      <style>{`
        @keyframes coverZoom { from { transform: scale(1.06); } to { transform: scale(1.0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scrollPulse { 0%,100%{opacity:0.4;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.15)} }
        @keyframes lbFade { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes gridIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .photo-item { animation: gridIn 0.5s ease both; }
        .photo-item:nth-child(1){animation-delay:.04s}.photo-item:nth-child(2){animation-delay:.08s}
        .photo-item:nth-child(3){animation-delay:.12s}.photo-item:nth-child(4){animation-delay:.16s}
        .photo-item:nth-child(5){animation-delay:.20s}.photo-item:nth-child(6){animation-delay:.24s}
        .photo-item:nth-child(7){animation-delay:.28s}.photo-item:nth-child(8){animation-delay:.32s}
        .photo-item:nth-child(9){animation-delay:.36s}.photo-item:nth-child(10){animation-delay:.40s}
        .photo-item:nth-child(11){animation-delay:.44s}.photo-item:nth-child(12){animation-delay:.48s}
      `}</style>

      {/* ── Floating Nav ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[200] h-[54px] flex items-center transition-all duration-350
          ${navScrolled
            ? 'bg-white/96 backdrop-blur-[18px] shadow-[0_1px_0_#ceecea]'
            : 'bg-transparent'
          }`}
        style={{ padding: '0 clamp(16px, 4vw, 48px)' }}
      >
        {/* Left: avatar + photographer + separator + gallery name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {photographer?.logo_url ? (
            <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border-[1.5px] transition-all ${navScrolled ? 'border-border' : 'border-white/40'}`}>
              <img src={photographer.logo_url!} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null}
          {photographerName && (
            <span className={`font-display text-[16px] font-normal whitespace-nowrap tracking-[0.03em] transition-colors ${navScrolled ? 'text-ink' : 'text-white/90'}`}>
              {photographerName}
            </span>
          )}
          {photographerName && (
            <div className={`w-px h-3.5 flex-shrink-0 transition-colors ${navScrolled ? 'bg-border' : 'bg-white/25'}`} />
          )}
          <span className={`text-[12px] font-light tracking-[0.06em] italic whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${navScrolled ? 'text-ink-muted' : 'text-white/55'}`}>
            {gallery.title}
          </span>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Favorites */}
          {gallery.favorites_enabled && (
            <div className="relative">
              <button
                className={`relative w-9 h-9 rounded-full flex items-center justify-center border transition-all
                  ${navScrolled
                    ? 'border-border bg-white text-ink hover:bg-teal-pale hover:border-teal'
                    : 'border-white/25 bg-white/10 backdrop-blur-[8px] text-white/85 hover:bg-white/22 hover:border-white/50'
                  }`}
                title="Favorites"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                {favorites.size > 0 && (
                  <span className="absolute -top-[3px] -right-[3px] w-[15px] h-[15px] rounded-full bg-teal text-white text-[8px] font-semibold flex items-center justify-center border-2 border-white">
                    {favorites.size}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Slideshow */}
          <button
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all
              ${navScrolled
                ? 'border-border bg-white text-ink hover:bg-teal-pale hover:border-teal'
                : 'border-white/25 bg-white/10 backdrop-blur-[8px] text-white/85 hover:bg-white/22 hover:border-white/50'
              }`}
            title="Slideshow"
            onClick={() => photos.length > 0 && setLightboxIdx(0)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>

          {/* Download pill */}
          {gallery.downloads_enabled && (
            <button
              onClick={downloadAll}
              disabled={dlAll}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-[18px] border font-ui text-[11.5px] font-normal tracking-[0.07em] uppercase cursor-pointer transition-all disabled:opacity-60 whitespace-nowrap
                ${navScrolled
                  ? 'bg-teal border-teal text-white hover:bg-teal-light hover:border-teal-light'
                  : 'bg-white/15 border-white/30 backdrop-blur-[8px] text-white/90 hover:bg-white/28'
                }`}
            >
              {dlAll ? (
                <svg className="w-[13px] h-[13px] animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Cover — 100vh ── */}
      <div
        ref={coverRef}
        className="relative w-screen overflow-hidden bg-ink"
        style={{ height: '100vh', minHeight: '600px' }}
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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(26,58,58,0.25) 100%), linear-gradient(to bottom, rgba(26,58,58,0.08) 0%, rgba(26,58,58,0.45) 100%)'
          }}
        />

        {/* Centered title */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
          {photographerName && (
            <div
              className="font-ui text-[11px] font-normal tracking-[0.22em] uppercase text-white/65 mb-[18px]"
              style={{ animation: 'fadeUp 1s ease 0.2s both' }}
            >
              {photographerName}
            </div>
          )}
          <h1
            className="font-display font-light text-white leading-[0.95] tracking-[-0.01em]"
            style={{
              fontSize: 'clamp(44px, 9vw, 100px)',
              animation: 'fadeUp 1s ease 0.4s both',
            }}
          >
            {gallery.title}
          </h1>
          <div
            className="font-ui text-[12px] font-light tracking-[0.18em] uppercase text-white/50 mt-[22px]"
            style={{ animation: 'fadeUp 1s ease 0.6s both' }}
          >
            {formattedDate}
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/45 cursor-pointer hover:text-white/80 transition-colors"
          style={{ animation: 'fadeUp 1s ease 1s both' }}
          onClick={() => document.getElementById('gallery-body')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-[9px] tracking-[0.2em] uppercase font-normal">Scroll</span>
          <div
            className="w-px h-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.5))',
              animation: 'scrollPulse 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* ── Gallery body ── */}
      <div className="bg-white" id="gallery-body">

        {/* Favorites bar */}
        {gallery.favorites_enabled && (
          <FavoritesBar
            count={favorites.size}
            onDownloadFavorites={downloadFavorites}
            onClearFavorites={() => setFavorites(new Set())}
            downloading={dlFavs}
          />
        )}

        {/* Sets nav placeholder */}
        <div
          className="flex items-center justify-center border-b border-border overflow-x-auto"
          style={{ padding: '0 clamp(16px,4vw,48px)' }}
        >
          <button className="px-[22px] py-4 text-[12px] font-medium tracking-[0.08em] uppercase text-ink border-b-2 border-teal -mb-px whitespace-nowrap bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer font-ui">
            All Photos
          </button>
        </div>

        {/* Gallery info row */}
        <div
          className="flex items-baseline gap-3.5 pt-[clamp(24px,4vw,40px)]"
          style={{ padding: `clamp(24px,4vw,40px) clamp(16px,4vw,48px) 0` }}
        >
          <h2 className="font-display font-light text-ink tracking-[0.01em]" style={{ fontSize: 'clamp(22px,4vw,32px)' }}>
            {gallery.title}
          </h2>
          <span className="text-[12px] text-ink-muted tracking-[0.05em]">{photos.length} photos</span>
        </div>

        {/* ── Masonry grid — 3 cols ── */}
        <div
          style={{
            padding: `clamp(12px,2vw,24px) clamp(8px,2vw,24px)`,
            columns: 3,
            columnGap: 'clamp(4px, 0.6vw, 8px)',
          }}
        >
          <style>{`
            @media (max-width: 900px) { #masonry { columns: 2 !important; padding-left: 0 !important; padding-right: 0 !important; column-gap: 2px !important; } }
            @media (max-width: 500px) { #masonry { columns: 2 !important; padding: 0 !important; column-gap: 2px !important; } }
          `}</style>
          {photos.map((photo, idx) => {
            const isFav = favorites.has(photo.id)
            return (
              <div
                key={photo.id}
                className="photo-item break-inside-avoid relative cursor-pointer overflow-hidden bg-teal-pale block group"
                style={{ marginBottom: 'clamp(4px, 0.6vw, 8px)' }}
                onClick={() => setLightboxIdx(idx)}
              >
                <img
                  src={photo.thumb_url}
                  alt={photo.filename ?? ''}
                  className="w-full block transition-transform duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04]"
                  loading="lazy"
                />
                {/* Hover action layer */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms] flex items-end justify-end p-3"
                  style={{ background: 'linear-gradient(to top, rgba(26,58,58,0.42) 0%, transparent 60%)' }}
                >
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    {gallery.favorites_enabled && (
                      <button
                        onClick={() => toggleFavorite(photo.id)}
                        className={`w-8 h-8 rounded-full bg-white/90 border-0 cursor-pointer flex items-center justify-center transition-all hover:bg-white hover:scale-[1.08] ${isFav ? 'text-[#d45f7a]' : 'text-ink'}`}
                      >
                        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                      </button>
                    )}
                    {gallery.downloads_enabled && (
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
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer
          className="flex flex-col items-center gap-3 border-t border-border bg-white"
          style={{ padding: `clamp(28px,4vw,48px) clamp(16px,4vw,48px)` }}
        >
          <div className="font-display text-[18px] font-light text-ink tracking-[0.06em]">
            {photographerName && <>{photographerName} <em className="italic text-teal">Photography</em></>}
          </div>
          <div className="text-[11px] text-ink-muted tracking-[0.08em]">
            Delivered with{' '}
            <span className="font-display text-[13px] font-medium text-ink">
              Frame<em className="italic text-teal">light</em>
            </span>
          </div>
        </footer>
      </div>

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
