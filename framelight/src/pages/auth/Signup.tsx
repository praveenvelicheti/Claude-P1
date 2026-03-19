import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studio, setStudio] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await signUp(email, password, studio)
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-appbg px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-teal-pale border border-teal/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="font-display text-[28px] font-medium text-ink mb-2">You're in!</h2>
          <p className="text-[14px] text-ink-muted">Check your email to confirm your account. Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-appbg font-ui">
      {/* Left panel */}
      <div className="hidden lg:flex w-[480px] flex-shrink-0 bg-ink flex-col relative overflow-hidden">
        <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(92,189,185,0.2)_0%,transparent_70%)]" />
        <div className="p-10 relative z-10">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="Framelight logo" className="w-8 h-8 brightness-0 invert" />
            <div className="font-display text-[28px] font-medium text-white tracking-[0.04em]">
              Frame<em className="text-teal-light italic">light</em>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center px-10 relative z-10">
          <h1 className="font-display text-[44px] font-light text-white leading-tight mb-4">
            Start delivering<br />
            <em className="italic text-teal-light">beautiful</em><br />
            galleries today.
          </h1>
          <p className="text-[15px] text-white/50 font-light leading-relaxed">
            Join thousands of photographers sharing work with their clients through Framelight.
          </p>
        </div>
        <div className="p-10 relative z-10">
          <div className="bg-white/[0.07] rounded-xl p-5">
            <div className="flex gap-3 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-teal" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <p className="text-[13px] text-white/70 italic leading-relaxed">
              "My clients absolutely love the gallery experience. Worth every penny."
            </p>
            <p className="text-[12px] text-white/40 mt-2">— Sarah K., Wedding Photographer</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <img src="/favicon.svg" alt="Framelight logo" className="w-7 h-7" />
            <div className="font-display text-[26px] font-medium text-ink tracking-[0.04em]">
              Frame<em className="text-teal italic">light</em>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-[32px] font-medium text-ink mb-2">Create your account</h2>
            <p className="text-[14px] text-ink-muted">Free forever — no credit card required.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-pink border border-pink-dark rounded-lg text-[13px] text-red">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={async () => { try { await signInWithGoogle() } catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed') } }}
              className="w-full flex items-center justify-center gap-3 py-[10px] px-4 border border-border rounded-[9px] bg-white hover:bg-gray-50 transition-all text-[13.5px] font-medium text-ink cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

          </div>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-ink-muted uppercase tracking-[0.08em]">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-1">
            <div className="mb-[18px]">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
                Studio / Business Name
              </label>
              <input
                type="text"
                value={studio}
                onChange={e => setStudio(e.target.value)}
                placeholder="Ember & Light Studio"
                className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none transition-all placeholder:text-ink-muted focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] focus:bg-white"
              />
            </div>

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
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Min 8 characters"
                className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none transition-all placeholder:text-ink-muted focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal text-white font-ui font-medium text-[14px] rounded-[9px] transition-all cursor-pointer hover:bg-teal-light hover:-translate-y-px disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              Create Account
            </button>
          </form>

          <p className="mt-3 text-center text-[12px] text-ink-muted">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>

          <p className="mt-5 text-center text-[13.5px] text-ink-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-teal font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
