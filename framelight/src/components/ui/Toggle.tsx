interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-[14px] border-b border-teal-pale last:border-b-0">
      <div>
        {label && <div className="text-[14px] text-[#2a5250]">{label}</div>}
        {description && <div className="text-[11.5px] text-ink-muted mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-[38px] h-[21px] rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-teal' : 'bg-border'}`}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`absolute top-[3px] w-[15px] h-[15px] rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? 'left-[20px]' : 'left-[3px]'}`}
        />
      </button>
    </div>
  )
}
