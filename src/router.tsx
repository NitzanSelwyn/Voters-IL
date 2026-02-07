import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import App from './App'

const NationalDashboard = lazy(() => import('./features/national/NationalDashboard'))
const CityView = lazy(() => import('./features/city/CityView'))
const PartyIndex = lazy(() => import('./features/party/PartyIndex'))
const PartyView = lazy(() => import('./features/party/PartyView'))
const CompareView = lazy(() => import('./features/compare/CompareView'))
const MapView = lazy(() => import('./features/map/MapView'))
const SearchPage = lazy(() => import('./features/search/SearchPage'))
const ShameView = lazy(() => import('./features/shame/ShameView'))

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LazyWrapper><NationalDashboard /></LazyWrapper> },
      { path: 'city/:cityCode', element: <LazyWrapper><CityView /></LazyWrapper> },
      { path: 'party', element: <LazyWrapper><PartyIndex /></LazyWrapper> },
      { path: 'party/:partyId', element: <LazyWrapper><PartyView /></LazyWrapper> },
      { path: 'compare', element: <LazyWrapper><CompareView /></LazyWrapper> },
      { path: 'map', element: <LazyWrapper><MapView /></LazyWrapper> },
      { path: 'search', element: <LazyWrapper><SearchPage /></LazyWrapper> },
      { path: 'shame', element: <LazyWrapper><ShameView /></LazyWrapper> },
    ],
  },
])
