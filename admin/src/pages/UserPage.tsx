import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Shield,
  CreditCard,
  Box,
  ArrowLeft,
  Github,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { adminApi } from "../lib/api";
import { cn } from "./utils";

export function UserPage() {
  const { userId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      adminApi.getUserDetails(userId),
      adminApi.listTransactions(userId, 10),
    ])
      .then(([userData, txData]) => {
        setUser(userData);
        setTransactions(txData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading)
    return (
      <div className="animate-pulse py-20 text-center">
        Loading User Data...
      </div>
    );
  if (!user)
    return <div className="py-20 text-center text-red-500">User Not Found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                {user.email || "Anonymous User"}
              </h1>
              <p className="text-slate-500 font-mono text-xs">{user.userId}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-white/5 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Current Balance
            </p>
            <p className="text-2xl font-black tracking-tight">
              £{(user.balanceCredits / 100).toFixed(2)}
            </p>
          </div>
          <button className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity">
            Add Adjustment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* GitHub & Integrations */}
          <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <Github className="w-5 h-5 text-slate-400" />
              Connected Accounts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      GitHub
                    </p>
                    <p className="text-sm font-bold text-white">
                      {user.githubInstallation?.accountLogin || "Not Linked"}
                    </p>
                  </div>
                </div>
                {user.githubInstallation ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-slate-700" />
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-blue-500">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Anthropic Key
                    </p>
                    <p className="text-sm font-bold text-white">BYOK Mode</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Recent Transactions
            </h2>
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      tx.amount_credits > 0
                        ? "bg-green-500/10 text-green-500"
                        : "bg-blue-500/10 text-blue-500",
                    )}
                  >
                    {tx.amount_credits > 0 ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">
                      {tx.description || tx.type}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {new Date(tx.created_at * 1000).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "text-sm font-black tracking-tight",
                      tx.amount_credits > 0 ? "text-green-500" : "text-white",
                    )}
                  >
                    {tx.amount_credits > 0 ? "+" : ""}£
                    {(tx.amount_credits / 100).toFixed(2)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center py-8 text-slate-500 uppercase font-black text-xs tracking-widest">
                  No transactions found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sessions & Secrets */}
        <div className="space-y-8">
          <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <Box className="w-5 h-5 text-purple-500" />
              Recent Boxes
            </h2>
            <div className="space-y-3">
              {user.sessions?.map((sb: any) => (
                <Link
                  key={sb.sessionId}
                  to={`/sessions/${sb.sessionId}`}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 block hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Box className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                          {sb.title || sb.sessionId}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Created{" "}
                          {new Date(sb.createdAt * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                        sb.status === "active"
                          ? "bg-green-500/10 border-green-500/20 text-green-500"
                          : "bg-white/5 border-white/10 text-slate-500",
                      )}
                    >
                      {sb.status || "unknown"}
                    </div>
                  </div>
                </Link>
              ))}
              {(!user.sessions || user.sessions.length === 0) && (
                <p className="text-center py-8 text-slate-500 uppercase font-black text-xs tracking-widest">
                  No sessions found
                </p>
              )}
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Box Secrets
            </h2>
            <div className="space-y-2">
              {user.boxSecrets?.map((secret: any) => (
                <div
                  key={secret.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {secret.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">
                      ****{secret.hint}
                    </p>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {new Date(secret.createdAt * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {user.boxSecrets?.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  No secrets configured
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
