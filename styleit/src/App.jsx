import { useStore } from './store/StoreContext'
import useShortcuts from './hooks/useShortcuts'
import AuthPage from './pages/AuthPage'
import BuyerPage from './pages/BuyerPage'
import SellerPage from './pages/SellerPage'
import AdminPage from './pages/AdminPage'
import HelpDialog from './components/HelpDialog'

// Decides which screen to show: login, admin, seller or buyer.
export default function App() {
  const { s, me, api } = useStore()
  useShortcuts()
  // While we check the saved login (or if the server is not running), show a simple message.
  if (!s.ready) {
    return (
      <div className="auth">
        <div className="phone" style={{ padding: '2rem', textAlign: 'center' }} role="status">
          {s.offline ? (
            <>
              <h1 style={{ fontSize: '1.4rem' }}>Can’t reach the server 😢</h1>
              <p className="meta">{s.offline}</p>
              <button className="pill" onClick={api.retry}>Try again</button>
            </>
          ) : <p>Loading StyleIt… 🎀</p>}
        </div>
      </div>
    )
  }
  return (
    <>
      {!me ? <AuthPage /> : me.role === 'admin' ? <AdminPage /> : s.mode === 'seller' ? <SellerPage /> : <BuyerPage />}
      <HelpDialog />
    </>
  )
}
