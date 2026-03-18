interface Props {
  count: number
  onDownloadFavorites: () => void
  onClearFavorites: () => void
  downloading: boolean
}

export function FavoritesBar({ count, onDownloadFavorites, onClearFavorites, downloading }: Props) {
  if (count === 0) return null
  return (
    <div
      className="flex items-center justify-between flex-wrap gap-2.5 border-b font-ui"
      style={{
        padding: '11px clamp(16px,4vw,48px)',
        background: '#fbe3e8',
        borderBottomColor: '#f0c8d0',
      }}
    >
      <div className="text-[13px] text-ink flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-[#d45f7a]" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        You've selected <strong className="text-[#d45f7a] mx-1">{count}</strong> favorite{count !== 1 ? 's' : ''}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onDownloadFavorites}
          disabled={downloading}
          className="flex items-center gap-1.5 px-4 py-[7px] rounded-[20px] bg-teal text-white border-0 font-ui text-[11.5px] font-normal tracking-[0.06em] uppercase cursor-pointer hover:bg-teal-light transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {downloading ? (
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          )}
          Download Favorites
        </button>
        <button
          onClick={onClearFavorites}
          className="text-[12px] text-[#b06070] hover:text-ink cursor-pointer bg-transparent border-0 font-ui transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
