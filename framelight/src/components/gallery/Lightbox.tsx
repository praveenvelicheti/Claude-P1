import { useEffect, useCallback, useState, useRef } from 'react'
import type { Photo } from '../../types/database'

interface Props {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onNav: (idx: number) => void
  favorites: Set<string>
  onToggleFavorite: (photoId: string) => void
  onDownload: (photo: Photo) => void
}

export function Lightbox({ photos, currentIndex, onClose, onNav, favorites, onToggleFavorite, onDownload }: Props) {
  const [visible, setVisible] = useState(false)
  const [slideDir, setSlideDir] = useState<'initial' | 'right' | 'left'>('initial')
  const prevIndexRef = useRef(currentIndex)
  const photo = photos[currentIndex]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const id = requestAnimationFrame(() => setVisible(true))
    return () => {
      document.body.style.overflow = ''
      cancelAnimationFrame(id)
    }
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 250)
  }, [onClose])

  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      setSlideDir(currentIndex > prevIndexRef.current ? 'right' : 'left')
      prevIndexRef.current = currentIndex
    }
  }, [currentIndex])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNav(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNav(currentIndex + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIndex, photos.length, onNav, handleClose])

  if (!photo) return null

  const isFav = favorites.has(photo.id)

  return (
    <div
      className={`fixed inset-0 z-[500] flex flex-col bg-white transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Top bar */}
      <div className="h-14 flex items-center px-[clamp(14px,3vw,28px)] gap-3.5 border-b border-black/[0.08] flex-shrink-0">
        <button
          onClick={handleClose}
          className="w-[34px] h-[34px] rounded-lg border border-black/15 bg-transparent cursor-pointer flex items-center justify-center text-black/70 hover:bg-black/5 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-display text-[16px] font-light text-black/80 truncate">{photo.filename ?? 'Photo'}</div>
          <div className="text-[11px] text-black/35">{currentIndex + 1} of {photos.length}</div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onToggleFavorite(photo.id)}
            className={`flex items-center gap-1.5 px-3 py-[7px] rounded-[7px] border text-[12px] cursor-pointer font-ui transition-colors ${
              isFav ? 'text-[#D05050] border-[#D05050]' : 'text-black/70 border-black/15 hover:bg-black/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span className="hidden sm:block">{isFav ? 'Favorited' : 'Favorite'}</span>
          </button>

          <button
            onClick={() => onDownload(photo)}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-[7px] border border-black/15 text-black/70 text-[12px] cursor-pointer font-ui hover:bg-black/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="hidden sm:block">Download</span>
          </button>
        </div>
      </div>

      {/* Image stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Prev */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNav(currentIndex - 1)}
            className="absolute left-4 z-10 w-10 h-10 rounded-full border border-black/15 bg-white shadow-sm flex items-center justify-center text-black/60 cursor-pointer hover:bg-black/5 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}

        <img
          key={photo.id}
          src={photo.url}
          alt={photo.filename ?? ''}
          className="max-w-full max-h-full object-contain rounded-[4px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] px-[clamp(50px,6vw,80px)] py-[clamp(10px,2vw,28px)]"
          style={{
            animation: slideDir === 'right'
              ? 'slideFromRight 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both'
              : slideDir === 'left'
              ? 'slideFromLeft 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both'
              : 'lbFade 0.3s ease both'
          }}
        />

        {/* Next */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onNav(currentIndex + 1)}
            className="absolute right-4 z-10 w-10 h-10 rounded-full border border-black/15 bg-white shadow-sm flex items-center justify-center text-black/60 cursor-pointer hover:bg-black/5 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>

      {/* Filmstrip */}
      <div className="h-20 flex-shrink-0 flex items-center gap-1.5 px-4 overflow-x-auto border-t border-black/[0.08]">
        {photos.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => onNav(idx)}
            className={`w-14 h-14 flex-shrink-0 rounded-md overflow-hidden transition-all cursor-pointer border-2 ${idx === currentIndex ? 'border-teal opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
          >
            <img src={p.thumb_url} alt="" className="w-full h-full object-cover block" />
          </button>
        ))}
      </div>
    </div>
  )
}
