import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Box, ArrowLeft, Clock, Terminal, 
  Info, Database, Activity, 
  Search, AlertTriangle
} from 'lucide-react'
import { adminApi } from '../lib/api'
import { cn } from './utils'

export function SessionPage() {
  const { sessionId } = useParams()
  const [logs, setLogs] = useState<any[]>([])
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'logs' | 'metadata' | 'files'>('logs')

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    Promise.all([
      adminApi.getSessionLogs(sessionId),
      adminApi.getSessionMetadata(sessionId)
    ]).then(([logsData, metaData]) => {
      setLogs(logsData.logs || [])
      setMetadata(metaData)
    }).catch(console.error).finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return <div className="animate-pulse py-20 text-center">Loading Session Data...</div>
  if (!metadata) return <div className="py-20 text-center text-red-500">Session Not Found</div>

  return (
    <div className="space-y-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <Link to={`/users/${metadata.userId}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Back to User {metadata.userId}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Box className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tighter uppercase italic">{sessionId}</h1>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                  metadata.status === 'active' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/10 text-slate-500"
                )}>
                  {metadata.status}
                </div>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Created {new Date(metadata.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all">
            Kill Session
          </button>
          <button className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity">
            Connect Debugger
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-white/5 rounded-2xl w-fit">
        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Terminal className="w-3.5 h-3.5" />} label="Command Logs" />
        <TabButton active={activeTab === 'metadata'} onClick={() => setActiveTab('metadata')} icon={<Info className="w-3.5 h-3.5" />} label="Raw Metadata" />
        <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<Database className="w-3.5 h-3.5" />} label="File System" />
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'logs' && (
          <div className="h-full border border-white/5 bg-slate-900/50 rounded-3xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Activity className="w-3.5 h-3.5" />
                Live Command Stream
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                <input 
                  type="text" 
                  placeholder="Filter logs..." 
                  className="bg-slate-950 border border-white/5 rounded-lg py-1 pl-8 pr-3 text-[10px] focus:outline-none focus:border-primary/50 transition-all w-48"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 group py-0.5">
                  <span className="text-slate-500 shrink-0 w-20 font-medium">[{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className={cn(
                    "flex-1 break-all",
                    log.type === 'stderr' ? 'text-red-400' : 'text-slate-200'
                  )}>
                    <span className="text-primary font-bold mr-2">$</span>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <Terminal className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-slate-500 uppercase font-black text-[10px] tracking-widest">No logs recorded for this session yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="h-full border border-white/5 bg-slate-900/50 rounded-3xl overflow-auto p-8">
            <pre className="text-xs font-mono text-blue-400 leading-relaxed">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="h-full border border-white/5 bg-slate-900/50 rounded-3xl flex items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Direct File Access Restricted</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                For security reasons, direct file system browsing is only available via the session debugger. 
                Full environment snapshots can be requested for forensics.
              </p>
              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Request Snapshot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
