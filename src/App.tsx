import { Outlet } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { MetaProvider } from '@/data/hooks'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageContainer } from '@/components/layout/PageContainer'

function App() {
  return (
    <ThemeProvider>
      <MetaProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <PageContainer>
              <Outlet />
            </PageContainer>
          </main>
          <Footer />
        </div>
      </MetaProvider>
    </ThemeProvider>
  )
}

export default App
