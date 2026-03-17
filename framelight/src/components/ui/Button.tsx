import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from './cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'teal' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center gap-2 font-ui font-medium rounded-[9px] border-0 cursor-pointer transition-all duration-200 select-none'
    const variants = {
      primary:   'bg-ink text-white hover:bg-[#0e2828] hover:-translate-y-px',
      teal:      'bg-teal text-white hover:bg-teal-light hover:-translate-y-px shadow-teal hover:shadow-teal',
      secondary: 'bg-teal-pale text-ink-mid border border-border hover:bg-border',
      ghost:     'bg-transparent text-ink-mid hover:bg-teal-pale',
      danger:    'bg-red text-white hover:opacity-90',
    }
    const sizes = {
      sm:  'px-3 py-1.5 text-xs',
      md:  'px-[22px] py-[10px] text-[13px]',
      lg:  'px-7 py-3 text-sm',
    }
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-60 pointer-events-none', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
