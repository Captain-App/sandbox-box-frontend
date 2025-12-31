import { ChevronDown, Plus, Box, Check } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { Sandbox } from "../data/sandboxes"
import { mockSandboxes } from "../data/sandboxes"
import { cn } from "../lib/utils"

interface SandboxSelectorProps {
  activeSandbox: Sandbox
  onSelect: (sandbox: Sandbox) => void
  onCreateNew: () => void
}

export function SandboxSelector({ activeSandbox, onSelect, onCreateNew }: SandboxSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Box className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Active Box</div>
          <div className="text-sm font-bold leading-none">{activeSandbox.name}</div>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform ml-2", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-slate-950 border border-white/10 shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            {mockSandboxes.map((sb) => (
              <button
                key={sb.id}
                onClick={() => {
                  onSelect(sb)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                  activeSandbox.id === sb.id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    sb.status === 'online' ? "bg-green-500" : "bg-white/20"
                  )} />
                  <div className="text-left">
                    <div className="text-sm font-bold">{sb.name}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-60">{sb.region}</div>
                  </div>
                </div>
                {activeSandbox.id === sb.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-white/5">
            <button 
              onClick={() => {
                onCreateNew()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-primary hover:bg-primary/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">Create New Box</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

