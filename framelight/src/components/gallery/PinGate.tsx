import { useState } from 'react'
import type { Gallery } from '../../types/database'

interface Props {
  gallery: Gallery
  onUnlock: () => void
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export function PinGate({ gallery, onUnlock }: Props) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')

  function pressKey(k: string) {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (k === '') return
    const next = pin + k
    setPin(next)
    if (next.length === 4) checkPin(next)
  }

  function checkPin(entered: string) {
    if (entered === gallery.pin_code) {
      sessionStorage.setItem(`pin_${gallery.id}`, '1')
      onUnlock()
    } else {
      setShake(true)
      setError('Incorrect PIN — try again')
      setTimeout(() => { setShake(false); setPin(''); setError('') }, 1000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-ui">
      {/* Hero */}
      <div className="flex-1 relative overflow-hidden min-h-[240px] max-h-[340px]">
        {gallery.cover_url ? (
          <img src={gallery.cover_url} alt="" className="w-full h-full object-cover block" />
        ) : (
          <div className="w-full h-full bg-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/55" />
        <div className="absolute bottom-0 left-0 right-0 px-7 pb-6 z-10">
          <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-white/65 mb-1.5">
            Private Gallery
          </div>
          <h1 className="font-display text-[clamp(24px,5vw,38px)] font-light text-white leading-tight">
            {gallery.title}
          </h1>
        </div>
      </div>

      {/* PIN form */}
      <div className="flex flex-col items-center px-6 py-8">
        {/* Lock icon */}
        <div className="w-12 h-12 rounded-full bg-teal-pale border border-teal/30 flex items-center justify-center mb-4 text-teal">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h2 className="font-display text-[22px] font-light text-ink mb-1.5 text-center">Enter your PIN</h2>
        <p className="text-[13px] text-[#6a9e9c] text-center mb-7">
          This gallery is password protected.{gallery.client_name ? ` Hi, ${gallery.client_name}!` : ''}
        </p>

        {/* PIN boxes */}
        <div className={`flex gap-2.5 mb-6 ${shake ? 'animate-[shake_0.35s_ease]' : ''}`}
          style={{ animation: shake ? 'shake 0.35s ease' : undefined }}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-[52px] h-[60px] border-2 rounded-xl flex items-center justify-center font-display text-[26px] text-ink transition-all duration-200 ${
                pin.length === i
                  ? 'border-teal shadow-[0_0_0_3px_rgba(92,189,185,0.18)] bg-white'
                  : i < pin.length
                  ? 'border-ink bg-white'
                  : shake
                  ? 'border-red bg-[#ebf6f5]'
                  : 'border-border bg-[#ebf6f5]'
              }`}
            >
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-[13px] text-red mb-4">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[260px]">
          {KEYS.map((k, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => pressKey(k)}
              disabled={k === ''}
              className={`h-[52px] border border-border rounded-[10px] bg-white font-display text-[22px] text-ink cursor-pointer transition-all hover:bg-[#ebf6f5] hover:border-ink active:bg-[#ebf6f5] disabled:invisible font-ui ${k === '⌫' ? 'font-ui text-[14px]' : ''}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
