import { useEffect, useState } from 'react'
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
  const [scrolled, setScrolled] = useState(false)
  const sessionToken = getSessionToken()

  useEffect(() => {
    if (!slug) return
    loadGallery()
  }, [slug])

  useEffect(() => {
    const el = document.querySelector('.gallery-scroll-container')
    if (!el) return
    const handler = () => setScrolled(el.scrollTop > 60)
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [gallery])

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

    // increment view count
    db.from('galleries').update({ view_count: (gallery.view_count ?? 0) + 1 }).eq('id', gallery.id)

    // load photographer
    const { data: prof } = await db.from('profiles').select('*').eq('id', gallery.photographer_id).single()
    if (prof) setPhotographer(prof as Profile)

    // load photos
    const { data: photoData } = await db.from('photos').select('*').eq('gallery_id', gallery.id).order('position')
    setPhotos((photoData ?? []) as Photo[])

    // load existing favorites
    const { data: favData } = await db.from('favorites').select('photo_id').eq('gallery_id', gallery.id).eq('session_token', sessionToken)
    if (favData) setFavorites(new Set((favData as Array<{ photo_id: string }>).map(f => f.photo_id)))

    // check PIN
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
      <div className="min-h-screen flex items-center justify-center bg-[#fbe3e8]">
        <div className="w-10 h-10 border-[3px] border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbe3e8] font-ui">
        <div className="text-center">
          <div className="font-display text-[32px] font-light text-ink mb-2">Gallery not found</div>
          <p className="text-[14px] text-ink-muted">This gallery may have expired or the link is incorrect.</p>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return <PinGate gallery={gallery} onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="gallery-scroll-container min-h-screen bg-white font-ui overflow-y-auto" style={{ ['--accent' as string]: photographer?.accent_color ?? '#5cbdb9' }}>
      {/* ── Sticky Nav ── */}
      <nav className={`sticky top-0 z-[100] bg-white/95 backdrop-blur-[16px] border-b border-[#ceecea] transition-shadow ${scrolled ? 'shadow-[0_2px_20px_rgba(26,58,58,0.08)]' : ''}`}>
        <div className="flex items-center px-[clamp(16px,4vw,48px)] h-14 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {photographer?.logo_url && (
              <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px] border-[#ceecea]">
                <img src={photographer.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="font-display text-[17px] font-medium text-ink tracking-[0.03em] truncate">
              {photographer?.studio_name ?? 'Studio'}
            </span>
            <div className="w-px h-[18px] bg-[#ceecea] flex-shrink-0" />
            <span className="text-[12.5px] text-[#6a9e9c] truncate italic">{gallery.title}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Favorites badge */}
            {gallery.favorites_enabled && favorites.size > 0 && (
              <button className="relative w-9 h-9 rounded-lg border border-[#ceecea] bg-transparent cursor-pointer flex items-center justify-center text-ink hover:bg-[#ebf6f5] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal text-white text-[9px] font-semibold flex items-center justify-center border-2 border-white">
                  {favorites.size}
                </span>
              </button>
            )}

            {/* Download All */}
            {gallery.downloads_enabled && (
              <button
                onClick={downloadAll}
                disabled={dlAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ink text-white border-0 cursor-pointer font-ui text-[12px] font-medium tracking-[0.04em] hover:bg-[#0E2828] transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {dlAll ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                <span>Download All</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-ink" style={{ height: 'clamp(320px, 55vw, 600px)' }}>
        {gallery.cover_url && (
          <img
            src={gallery.cover_url}
            alt=""
            className="w-full h-full object-cover block"
            style={{ animation: 'heroZoom 18s ease-in-out infinite alternate', transform: 'scale(1.04)' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/8 via-transparent to-black/55" />
        <div className="absolute bottom-0 left-0 right-0 p-[clamp(24px,4vw,56px)] flex items-end justify-between gap-5">
          <div>
            <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-white/60 mb-2">
              {photographer?.studio_name}
            </div>
            <h1 className="font-display text-[clamp(28px,6vw,64px)] font-light text-white leading-[1.05] tracking-[-0.01em]">
              {gallery.title}
            </h1>
            <div className="flex items-center gap-3.5 mt-3">
              <span className="text-[12px] text-white/55 flex items-center gap-1.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {gallery.expiry_date ? `Expires ${new Date(gallery.expiry_date).toLocaleDateString()}` : 'No expiry'}
              </span>
              <span className="text-[12px] text-white/55 flex items-center gap-1.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                {photos.length} photos
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5 text-white/40 text-[10px] tracking-[0.1em] uppercase font-medium pb-1 animate-[bobble_2s_ease-in-out_infinite]">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            Scroll
          </div>
        </div>
      </div>

      {/* ── Favorites Bar ── */}
      {gallery.favorites_enabled && (
        <FavoritesBar
          count={favorites.size}
          onDownloadFavorites={downloadFavorites}
          onClearFavorites={() => setFavorites(new Set())}
          downloading={dlFavs}
        />
      )}

      {/* ── Section label ── */}
      <div className="flex items-center justify-between px-[clamp(16px,4vw,48px)] pt-[clamp(20px,3vw,36px)]">
        <h2 className="font-display text-[clamp(18px,3vw,26px)] font-light text-ink tracking-[0.01em]">
          The <em className="italic">Gallery</em>
        </h2>
        <span className="text-[12.5px] text-[#6a9e9c]">{photos.length} photos</span>
      </div>

      {/* ── Masonry Grid ── */}
      <div
        className="px-[clamp(12px,3vw,48px)] pt-4 pb-[clamp(40px,5vw,80px)]"
        style={{ columns: 'var(--cols, 3)', columnGap: 'clamp(6px, 1vw, 10px)' } as React.CSSProperties}
      >
        <style>{`
          @media (max-width: 900px) { .masonry-grid { --cols: 2 !important; } }
          @media (max-width: 500px) { .masonry-grid { --cols: 2 !important; } }
          @keyframes heroZoom { from { transform: scale(1.04); } to { transform: scale(1.0); } }
          @keyframes bobble { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
          @keyframes lbFade { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
          @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
          @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes modalIn { from{opacity:0;transform:scale(0.92) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        `}</style>

        {photos.map((photo, idx) => {
          const isFav = favorites.has(photo.id)
          return (
            <div
              key={photo.id}
              className="masonry-grid break-inside-avoid mb-[clamp(6px,1vw,10px)] relative cursor-pointer rounded-[clamp(6px,1vw,10px)] overflow-hidden bg-teal-pale block group"
              onClick={() => setLightboxIdx(idx)}
            >
              <img
                src={photo.thumb_url}
                alt={photo.filename ?? ''}
                className="w-full block transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-end justify-between p-[clamp(8px,1.5vw,14px)]">
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                  {gallery.favorites_enabled && (
                    <button
                      onClick={() => toggleFavorite(photo.id)}
                      className={`w-[clamp(28px,3.5vw,34px)] h-[clamp(28px,3.5vw,34px)] rounded-full bg-white/92 border-0 cursor-pointer flex items-center justify-center transition-all hover:scale-110 ${isFav ? 'text-red' : 'text-ink'}`}
                    >
                      <svg className="w-[clamp(12px,1.5vw,15px)] h-[clamp(12px,1.5vw,15px)]" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </button>
                  )}
                  {gallery.downloads_enabled && (
                    <button
                      onClick={() => downloadPhoto(photo)}
                      className="w-[clamp(28px,3.5vw,34px)] h-[clamp(28px,3.5vw,34px)] rounded-full bg-white/92 border-0 cursor-pointer flex items-center justify-center text-ink transition-all hover:scale-110"
                    >
                      <svg className="w-[clamp(12px,1.5vw,15px)] h-[clamp(12px,1.5vw,15px)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* ── Footer ── */}
      <footer className="border-t border-[#ceecea] px-[clamp(16px,4vw,48px)] py-8 flex items-center justify-between flex-wrap gap-4">
        <div className="text-[12px] text-[#6a9e9c]">
          Delivered by <strong className="text-ink">{photographer?.studio_name}</strong>
        </div>
        <div className="text-[11px] text-[#aab8b8] flex items-center gap-1">
          Powered by
          <span className="font-display text-[13px] font-medium text-ink ml-1">
            Frame<em className="italic text-teal">light</em>
          </span>
        </div>
      </footer>

      {/* ── Lightbox ── */}
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
