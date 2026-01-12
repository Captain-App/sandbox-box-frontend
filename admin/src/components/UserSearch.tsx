import { useState, useEffect, useRef } from "react";
import { Search, Users, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../lib/api";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector(
          'input[type="search"]',
        ) as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await adminApi.searchUsers(query);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (userId: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/users/${userId}`);
  };

  return (
    <div className="relative w-full max-w-xl" ref={searchRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
        <input
          type="search"
          placeholder="Search users by ID or GitHub login... (Cmd+K)"
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3 h-3 text-primary animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-2">
            {results.map((user) => (
              <button
                key={user.userId}
                onClick={() => handleSelect(user.userId)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {user.email || "Anonymous"}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {user.userId}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Balance
                  </p>
                  <p className="text-xs font-black text-white">
                    £{(user.balanceCredits / 100).toFixed(2)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl z-50">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            No users found
          </p>
        </div>
      )}
    </div>
  );
}
