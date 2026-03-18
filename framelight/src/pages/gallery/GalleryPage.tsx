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
  const sessionToken = getSessionToken()
  const galleryNavRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    loadGallery()
  }, [slug])

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

  function scrollToGallery() {
    galleryNavRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  }).toUpperCase().replace(/(\d+),/, (_, d) => {
    const n = parseInt(d)
    const s = ['TH','ST','ND','RD']
    const v = n % 100
    return `${d}${s[(v - 20) % 10] || s[v] || s[0]},`
  })

  return (
    <div className="min-h-screen bg-white font-ui">
      <style>{`
        @keyframes heroZoom { from { transform: scale(1.06); } to { transform: scale(1.0); } }
        @keyframes lbFade { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.92) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#1a1a1a]" style={{ height: '56vh', minHeight: '340px', maxHeight: '680px' }}>
        {gallery.cover_url && (
          <img
            src={gallery.cover_url}
            alt=""
            className="w-full h-full object-cover block"
            style={{ animation: 'heroZoom 18s ease-in-out infinite alternate' }}
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        {/* Centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-display text-[clamp(32px,6vw,72px)] font-light text-white leading-[1.05] tracking-[-0.01em] mb-4">
            {gallery.title}
          </h1>
          <p className="text-[11px] font-medium tracking-[0.18em] text-white/70 uppercase mb-8">
            {formattedDate}
          </p>
          <button
            onClick={scrollToGallery}
            className="text-white text-[14px] font-light tracking-[0.04em] border-0 bg-transparent cursor-pointer underline underline-offset-4 decoration-white/60 hover:decoration-white transition-colors"
          >
            View Gallery
          </button>
        </div>
      </div>

      {/* ── Gallery Sticky Nav ── */}
      <div ref={galleryNavRef} className="sticky top-0 z-[100] bg-white border-b border-[#e8e8e8]">
        <div className="flex items-center px-6 h-[62px] gap-6">
          {/* Left: title + photographer */}
          <div className="flex-shrink-0 pr-6 border-r border-[#e8e8e8]">
            <div className="font-display text-[16px] font-medium text-ink leading-tight tracking-[0.01em]">
              {gallery.title}
            </div>
            {photographer?.studio_name && (
              <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#999] mt-[1px]">
                {photographer.studio_name}
              </div>
            )}
          </div>

          {/* Center: section tabs (placeholder with gallery layout) */}
          <div className="flex items-center gap-6 flex-1 min-w-0 overflow-hidden">
            <button className="text-[13.5px] font-medium text-ink whitespace-nowrap border-0 bg-transparent cursor-pointer p-0 hover:text-[#555] transition-colors">
              {gallery.title}
            </button>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-5 flex-shrink-0">
            {gallery.favorites_enabled && (
              <button
                className="flex items-center gap-1.5 text-[13px] text-[#444] border-0 bg-transparent cursor-pointer p-0 hover:text-ink transition-colors"
              >
                <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill={favorites.size > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <span>Favorites{favorites.size > 0 ? ` (${favorites.size})` : ''}</span>
              </button>
            )}
            {gallery.downloads_enabled && (
              <button
                onClick={downloadAll}
                disabled={dlAll}
                className="flex items-center gap-1.5 text-[13px] text-[#444] border-0 bg-transparent cursor-pointer p-0 hover:text-ink transition-colors disabled:opacity-50"
              >
                {dlAll ? (
                  <svg className="w-[16px] h-[16px] animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                <span>Download</span>
              </button>
            )}
            <button className="flex items-center gap-1.5 text-[13px] text-[#444] border-0 bg-transparent cursor-pointer p-0 hover:text-ink transition-colors">
              <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>Share</span>
            </button>
            <button className="flex items-center gap-1.5 text-[13px] text-[#444] border-0 bg-transparent cursor-pointer p-0 hover:text-ink transition-colors">
              <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Slideshow</span>
            </button>
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

      {/* ── Masonry Grid ── */}
      <div
        className="px-0 pb-[clamp(40px,5vw,80px)]"
        style={{ columns: 'var(--cols, 4)', columnGap: '3px' } as React.CSSProperties}
      >
        <style>{`
          @media (max-width: 1100px) { .masonry-grid { --cols: 3 !important; } }
          @media (max-width: 700px) { .masonry-grid { --cols: 2 !important; } }
        `}</style>
        {photos.map((photo, idx) => {
          const isFav = favorites.has(photo.id)
          return (
            <div
              key={photo.id}
              className="masonry-grid break-inside-avoid mb-[3px] relative cursor-pointer overflow-hidden bg-[#f0f0f0] block group"
              onClick={() => setLightboxIdx(idx)}
            >
              <img
                src={photo.thumb_url}
                alt={photo.filename ?? ''}
                className="w-full block transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end p-3">
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {gallery.favorites_enabled && (
                    <button
                      onClick={() => toggleFavorite(photo.id)}
                      className={`w-8 h-8 rounded-full bg-white/90 border-0 cursor-pointer flex items-center justify-center transition-transform hover:scale-110 ${isFav ? 'text-red-500' : 'text-[#333]'}`}
                    >
                      <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </button>
                  )}
                  {gallery.downloads_enabled && (
                    <button
                      onClick={() => downloadPhoto(photo)}
                      className="w-8 h-8 rounded-full bg-white/90 border-0 cursor-pointer flex items-center justify-center text-[#333] transition-transform hover:scale-110"
                    >
                      <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  )}
                  <button
                    className="w-8 h-8 rounded-full bg-white/90 border-0 cursor-pointer flex items-center justify-center text-[#333] transition-transform hover:scale-110"
                  >
                    <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#e8e8e8] px-8 py-8 flex items-center justify-between flex-wrap gap-4">
        <div className="text-[12px] text-[#888]">
          Delivered by <strong className="text-ink">{photographer?.studio_name}</strong>
        </div>
        <div className="text-[11px] text-[#bbb] flex items-center gap-1">
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
