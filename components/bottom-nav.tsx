'use client'

import { Calendar, Lightbulb, BarChart3 } from 'lucide-react'

export type TabType = 'today' | 'ideas' | 'insights'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const TABS: { id: TabType; label: string; icon: typeof Calendar }[] = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-sm border-t safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
