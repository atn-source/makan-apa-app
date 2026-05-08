'use client'

import { useState, useEffect } from 'react'
import { BottomNav, type TabType } from '@/components/bottom-nav'
import { TodayScreen } from '@/components/screens/today-screen'
import { IdeasScreen } from '@/components/screens/ideas-screen'
import { InsightsScreen } from '@/components/screens/insights-screen'
import { loadDemoData } from '@/lib/demo-data'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('today')

  useEffect(() => {
    // Load demo data on first visit
    loadDemoData()
  }, [])

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'ideas' && <IdeasScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
