import { useState, useEffect } from 'react'
import { Users, Activity, CreditCard, Box, ExternalLink, ArrowUpRight, Clock, Settings } from 'lucide-react'
import { adminApi } from '../lib/api'

export function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">System Overview</h1>
          <p className="text-slate-500">Real-time platform metrics and status.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Systems Healthy
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={<Users className="w-5 h-5" />} 
          subtitle={`${stats?.activeUsers24h || 0} active today`}
        />
        <StatCard 
          title="Active Sessions" 
          value={stats?.activeSessions || 0} 
          icon={<Box className="w-5 h-5" />} 
          subtitle={`${stats?.totalSessions || 0} total created`}
        />
        <StatCard 
          title="Total Revenue" 
          value={`£${((stats?.totalRevenue || 0) / 100).toFixed(2)}`} 
          icon={<CreditCard className="w-5 h-5" />} 
          subtitle={`+£${((stats?.revenueToday || 0) / 100).toFixed(2)} today`}
          trend="up"
        />
        <StatCard 
          title="Avg. Session Time" 
          value="42m" 
          icon={<Clock className="w-5 h-5" />} 
          subtitle="Across all users"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl relative overflow-hidden">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent System Events
            </h2>
            <div className="space-y-4">
              <EventRow type="usage" title="Session usage tracked" detail="user_2p... consumed 42 credits" time="2m ago" />
              <EventRow type="topup" title="Credit top-up" detail="user_9x... added £10.00" time="15m ago" />
              <EventRow type="session" title="New session created" detail="user_1a... started sandbox-v4" time="22m ago" />
              <EventRow type="error" title="Session launch failed" detail="Region 'us-east-1' at capacity" time="1h ago" />
            </div>
            <div className="mt-8">
              <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                View All Events
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6">Support Quick-links</h2>
            <div className="space-y-3">
              <SupportLink icon={<Users className="w-4 h-4" />} title="User Lookup" description="Find account by ID or email" />
              <SupportLink icon={<Activity className="w-4 h-4" />} title="Error Monitor" description="Real-time Sentry issues" />
              <SupportLink icon={<ExternalLink className="w-4 h-4" />} title="Stripe Dashboard" description="Manage payments directly" />
              <SupportLink icon={<Settings className="w-4 h-4" />} title="Platform Settings" description="Global feature flags" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, subtitle, trend }: any) {
  return (
    <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
          {icon}
        </div>
        {trend === 'up' && (
          <div className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase">
            <ArrowUpRight className="w-3 h-3" />
            +12%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
        <p className="text-3xl font-black tracking-tighter">{value}</p>
        <p className="text-[10px] text-slate-500 font-bold">{subtitle}</p>
      </div>
    </div>
  )
}

function EventRow({ type, title, detail, time }: any) {
  const icons: any = {
    usage: <Activity className="w-4 h-4 text-blue-500" />,
    topup: <CreditCard className="w-4 h-4 text-green-500" />,
    session: <Box className="w-4 h-4 text-purple-500" />,
    error: <Activity className="w-4 h-4 text-red-500" />,
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/5 -mx-4 px-4 rounded-xl transition-colors">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-slate-500 truncate">{detail}</p>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
        {time}
      </div>
    </div>
  )
}

function SupportLink({ icon, title, description }: any) {
  return (
    <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left">
      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{description}</p>
      </div>
    </button>
  )
}
