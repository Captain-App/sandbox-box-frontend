import React, { useState } from "react"
import { Box, X, Shield, Globe, Github } from "lucide-react"
import { Button } from "./ui/Button"
import { cn } from "../lib/utils"

interface CreateSandboxModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, region: string, repository?: string) => void
}

const regions = [
  { id: 'lhr', name: 'London (LHR)', icon: '🇬🇧' },
  { id: 'jfk', name: 'New York (JFK)', icon: '🇺🇸' },
  { id: 'nrt', name: 'Tokyo (NRT)', icon: '🇯🇵' },
  { id: 'fra', name: 'Frankfurt (FRA)', icon: '🇩🇪' },
]

export function CreateSandboxModal({ isOpen, onClose, onCreate }: CreateSandboxModalProps) {
  const [name, setName] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("lhr")
  const [repo, setRepo] = useState("")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl p-8 rounded-[2.5rem] border border-white/10 bg-slate-950 shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Box className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">New Sandbox Box</h2>
              <p className="text-muted-foreground text-sm">Spin up a fresh persistent agent environment.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Box Name</label>
              <input
                type="text"
                placeholder="e.g. My New Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Deploy Region</label>
              <div className="grid grid-cols-2 gap-2">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      selectedRegion === region.id 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-white/5 border-white/5 hover:border-white/10 text-muted-foreground"
                    )}
                  >
                    <span className="text-lg">{region.icon}</span>
                    <span className="text-xs font-bold">{region.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Initial Repository (Optional)</label>
              <div className="relative">
                <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              className="w-full py-6 text-lg uppercase tracking-widest gap-3"
              disabled={!name}
              onClick={() => onCreate(name, selectedRegion, repo)}
            >
              <Zap className="w-5 h-5" />
              Initialise Sandbox
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest">
              Standard compute rates apply: approx. £0.01 / hour idle
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



