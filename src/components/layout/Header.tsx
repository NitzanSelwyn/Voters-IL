import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Sun, Moon, Monitor, Search } from 'lucide-react'
import { useThemeContext } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { SearchBar } from '@/components/search/SearchBar'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'סקירה ארצית' },
  { path: '/compare', label: 'השוואה' },
  { path: '/map', label: 'מפה' },
  { path: '/search', label: 'חיפוש' },
]

export function Header() {
  const { mode, toggle } = useThemeContext()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  const themeIcon = mode === 'dark' ? <Moon className="h-5 w-5" /> :
    mode === 'light' ? <Sun className="h-5 w-5" /> :
    <Monitor className="h-5 w-5" />

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="font-bold text-lg text-primary whitespace-nowrap">
          בוטרס-דיף
        </Link>

        {!isMobile && (
          <>
            <nav className="flex items-center gap-1 me-auto">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="w-64">
              <SearchBar />
            </div>
          </>
        )}

        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="החלף ערכת נושא"
        >
          {themeIcon}
        </button>

        {isMobile && (
          <>
            <Link to="/search" className="p-2 rounded-md hover:bg-accent ms-auto">
              <Search className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-accent"
              aria-label="תפריט"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </>
        )}
      </div>

      {isMobile && menuOpen && (
        <nav className="border-t border-border bg-background px-4 py-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                location.pathname === item.path
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
