import { type ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, subtitle, children, footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end xs:items-center justify-center bg-ink/45 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={[
          'bg-white w-full xs:w-auto xs:rounded-[18px] xs:max-w-[95vw]',
          // Mobile: bottom sheet
          'rounded-t-[20px] rounded-b-none xs:rounded-[18px]',
          'p-6 xs:p-9',
          'xs:w-[480px]',
          'shadow-[0_24px_64px_rgba(26,58,58,0.2)]',
          'animate-[modalIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]',
        ].join(' ')}
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Drag handle — mobile only */}
        <div className="xs:hidden w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <div className="font-display text-2xl font-medium text-ink mb-1.5">{title}</div>
        {subtitle && <div className="text-[13.5px] text-ink-muted mb-7">{subtitle}</div>}
        {children}
        {footer && <div className="flex gap-2.5 justify-end mt-6">{footer}</div>}
      </div>
    </div>
  )
}
