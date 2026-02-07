import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Sun, Moon, Monitor, Search, Vote } from 'lucide-react'
import { useThemeContext } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { SearchBar } from '@/components/search/SearchBar'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'סקירה ארצית' },
  { path: '/compare', label: 'השוואה' },
  { path: '/map', label: 'מפה' },
  { path: '/party', label: 'מפלגות' },
  { path: '/shame', label: 'קיר הבושה' },
  { path: '/search', label: 'חיפוש' },
]

function isNavActive(pathname: string, itemPath: string) {
  if (itemPath === '/') return pathname === '/'
  return pathname === itemPath || pathname.startsWith(itemPath + '/')
}

export function Header() {
  const { mode, toggle } = useThemeContext()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  const themeIcon = mode === 'dark' ? <Moon className="h-4 w-4" /> :
    mode === 'light' ? <Sun className="h-4 w-4" /> :
    <Monitor className="h-4 w-4" />

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 glass-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Vote className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight whitespace-nowrap">
            בוטרס<span className="text-primary">-דיף</span>
          </span>
        </Link>

        {!isMobile && (
          <>
            <nav className="flex items-center gap-0.5 me-auto ms-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isNavActive(location.pathname, item.path)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="w-60">
              <SearchBar />
            </div>
          </>
        )}

        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="החלף ערכת נושא"
        >
          {themeIcon}
        </button>

        {isMobile && (
          <>
            <Link to="/search" className="p-2 rounded-lg hover:bg-accent text-muted-foreground ms-auto">
              <Search className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
              aria-label="תפריט"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </>
        )}
      </div>

      {isMobile && menuOpen && (
        <nav className="border-t border-border bg-card px-4 py-2 animate-fade-in">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isNavActive(location.pathname, item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
