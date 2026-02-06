import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {children}
    </div>
  )
}
