interface Props {
  count: number
  onDownloadFavorites: () => void
  onClearFavorites: () => void
  downloading: boolean
}

export function FavoritesBar({ count, onDownloadFavorites, onClearFavorites, downloading }: Props) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-3 px-[clamp(16px,4vw,48px)] py-2.5 bg-teal-pale border-b border-teal/25 flex-wrap font-ui">
      <span className="text-[13px] text-[#2D2C26] flex-1">
        <strong className="text-teal">{count} photo{count !== 1 ? 's' : ''}</strong> in your favorites
      </span>
      <button
        onClick={onDownloadFavorites}
        disabled={downloading}
        className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] bg-teal text-white border-0 cursor-pointer text-[12px] font-medium hover:bg-teal-light transition-colors disabled:opacity-60"
      >
        {downloading ? (
          <svg className="w-[13px] h-[13px] animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        ) : (
          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        Download Favorites
      </button>
      <button
        onClick={onClearFavorites}
        className="text-[12px] text-[#6a9e9c] hover:text-ink cursor-pointer bg-transparent border-0 font-ui"
      >
        Clear all
      </button>
    </div>
  )
}
