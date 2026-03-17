import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-appbg font-ui">
      {/* Left panel */}
      <div className="hidden lg:flex w-[480px] flex-shrink-0 bg-ink flex-col relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(92,189,185,0.2)_0%,transparent_70%)]" />
        <div className="absolute -bottom-20 right-36 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(251,227,232,0.08)_0%,transparent_70%)]" />

        {/* Logo */}
        <div className="p-10 relative z-10">
          <div className="font-display text-[28px] font-medium text-white tracking-[0.04em]">
            Frame<em className="text-teal-light italic">light</em>
          </div>
        </div>

        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center px-10 relative z-10">
          <h1 className="font-display text-[44px] font-light text-white leading-tight mb-4">
            Your work,<br />
            <em className="italic text-teal-light">beautifully</em><br />
            delivered.
          </h1>
          <p className="text-[15px] text-white/50 font-light leading-relaxed">
            A photo delivery platform built for photographers who care about the details.
          </p>
        </div>

        {/* Feature pills */}
        <div className="p-10 flex flex-col gap-3 relative z-10">
          {['Branded client galleries', 'PIN-protected sharing', 'Direct R2 storage'].map(feat => (
            <div key={feat} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-teal-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-[13px] text-white/60">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden font-display text-[26px] font-medium text-ink tracking-[0.04em] mb-10 text-center">
            Frame<em className="text-teal italic">light</em>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-[32px] font-medium text-ink mb-2">Welcome back</h2>
            <p className="text-[14px] text-ink-muted">Sign in to your photographer dashboard.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-pink border border-pink-dark rounded-lg text-[13px] text-red">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-1">
            <div className="mb-[18px]">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@studio.com"
                className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none transition-all placeholder:text-ink-muted focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] focus:bg-white"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-[7px]">
                <label className="text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted">
                  Password
                </label>
                <button type="button" className="text-[12px] text-teal hover:underline font-medium bg-transparent border-0 p-0 cursor-pointer">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none transition-all placeholder:text-ink-muted focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ink text-white font-ui font-medium text-[14px] rounded-[9px] transition-all cursor-pointer hover:bg-[#0e2828] hover:-translate-y-px disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-[13.5px] text-ink-muted">
            New to Framelight?{' '}
            <Link to="/signup" className="text-teal font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
