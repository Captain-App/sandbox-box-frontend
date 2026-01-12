import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { LayoutDashboard, Users, Activity, LogOut, Loader2, AlertCircle } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { UserPage } from './pages/UserPage'
import { SessionPage } from './pages/SessionPage'
import { LoginPage } from './pages/Login'
import { UserSearch } from './components/UserSearch'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user, isAdmin, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-white/5 border border-white/10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Access Denied</h1>
            <p className="text-slate-400 text-sm italic">
              Authenticated as {user.email}, but the 'admin' role is required to access this portal.
            </p>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-black text-white">S</span>
            </div>
            <span className="font-black tracking-tighter text-xl uppercase italic">Shipbox Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 text-sm font-bold rounded-xl bg-white/5 text-white">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/users" className="flex items-center gap-3 px-4 py-2 text-sm font-bold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Users className="w-4 h-4" />
            Users
          </Link>
          <Link to="/activity" className="flex items-center gap-3 px-4 py-2 text-sm font-bold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Activity className="w-4 h-4" />
            System Activity
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="px-4 py-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 truncate uppercase font-black tracking-tighter">Admin Role</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-30">
          <UserSearch />
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/sessions/:sessionId" element={<SessionPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
