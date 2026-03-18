import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'

interface ToastMessage {
  id: number
  message: string
  type?: 'success' | 'error'
}

interface ToastContextValue {
  show: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  let nextId = 0

  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-[76px] right-4 md:bottom-7 md:right-7 z-[9999] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 bg-ink text-white px-5 py-[13px] rounded-[10px] text-[13.5px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
          >
            {toast.type === 'error' ? (
              <svg className="w-4 h-4 text-red flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-teal-light flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
