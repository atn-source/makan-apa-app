'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Meal, MealStats } from '@/lib/types'
import {
  calculateStats,
  formatCurrency,
  formatShortDate,
  getDaysAgo,
  getToday,
  generateMealsCsv
} from '@/lib/meal-storage'
import { getMealsFromDb, getMealsForDateRangeFromDb, clearAllMealsFromDb } from '@/lib/meal-database'
import { restoreDemoDataToDb } from '@/lib/demo-data'
import { generateHealthRecommendation } from '@/lib/recommendations'
import { calculateVendorAnalytics } from '@/lib/vendor-analytics'
import { MealCard } from '@/components/meal-card'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Home,
  ShoppingBag,
  Flame,
  Leaf,
  Star,
  Search,
  DollarSign,
  Download,
  Trash2,
  FileText,
  Droplet,
  TrendingUp,
  Lightbulb,
  Utensils,
  Calendar,
  Compass,
  Clock,
  Sparkles
} from 'lucide-react'

type TimeRange = '7d' | '30d' | 'all'

export function InsightsScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [meals, setMeals] = useState<Meal[]>([])
  const [stats, setStats] = useState<MealStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showJournal, setShowJournal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadData() {
      let filteredMeals: Meal[]
      const today = getToday()

      switch (timeRange) {
        case '7d':
          filteredMeals = await getMealsForDateRangeFromDb(getDaysAgo(7), today)
          break
        case '30d':
          filteredMeals = await getMealsForDateRangeFromDb(getDaysAgo(30), today)
          break
        default:
          filteredMeals = await getMealsFromDb()
      }

      setMeals(filteredMeals)
      setStats(calculateStats(filteredMeals))
    }

    loadData()
  }, [timeRange, refreshKey])

  const dailySpending = useMemo(() => {
    const spendingByDay: Record<string, number> = {}
    const today = getToday()
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      spendingByDay[getDaysAgo(i)] = 0
    }
    
    // Sum up spending
    meals.forEach(meal => {
      if (meal.cost && spendingByDay[meal.date] !== undefined) {
        spendingByDay[meal.date] += meal.cost
      }
    })
    
    return Object.entries(spendingByDay).map(([date, amount]) => ({
      date,
      amount,
      label: formatShortDate(date)
    }))
  }, [meals])

  const maxDailySpending = Math.max(...dailySpending.map(d => d.amount), 1)

  const filteredJournalMeals = useMemo(() => {
    if (!searchQuery.trim()) return meals.sort((a, b) => b.date.localeCompare(a.date))

    const query = searchQuery.toLowerCase()
    return meals
      .filter(meal =>
        meal.food.toLowerCase().includes(query) ||
        meal.vendor?.toLowerCase().includes(query) ||
        meal.notes?.toLowerCase().includes(query) ||
        meal.tags?.some(tag => tag.toLowerCase().includes(query))
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [meals, searchQuery])

  const vendorAnalytics = useMemo(() => {
    return calculateVendorAnalytics(meals)
  }, [meals])


  const handleExportCsv = () => {
    const csv = generateMealsCsv(meals)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `makan-apa-journal-${getToday()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleClearAllData = async () => {
    if (!confirm('Hapus semua catatan makanan? Tindakan ini tidak bisa dibatalkan.')) return
    await clearAllMealsFromDb()
    setSearchQuery('')
    setShowJournal(false)
    setRefreshKey(k => k + 1)
  }

  const handleRestoreDemoData = async () => {
    if (!confirm('Ganti data saat ini dengan demo data?')) return
    await restoreDemoDataToDb()
    setRefreshKey(k => k + 1)
  }

  const timeRangeLabel = {
    '7d': '7 Hari',
    '30d': '30 Hari',
    'all': 'Semua'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        </div>
        
        {/* Time Range Tabs */}
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as TimeRange[]).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="flex-1"
            >
              {timeRangeLabel[range]}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAllData} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Reset data
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRestoreDemoData} className="mt-2 w-full text-muted-foreground">
          Restore demo data
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Stats Overview */}
        {stats && (
          <section className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Spending</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(stats.totalSpending)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Avg Rating</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.avgRating.toFixed(1)} / 5
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Masak Sendiri</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.homeCookedMeals}
                </p>
                <p className="text-xs text-muted-foreground">
                  dari {meals.length} makanan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Makan Luar</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.outsideMeals}
                </p>
                <p className="text-xs text-muted-foreground">
                  dari {meals.length} makanan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Makanan Goreng</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.friedMeals}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Sayuran</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.vegetableMeals}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Minuman Manis</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.sugaryDrinks}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Tinggi Kalori</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.highCalorieMeals}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Variasi Protein</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.proteinVariety.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  jenis
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Health Recommendation */}
        {stats && meals.length > 0 && (() => {
          const rec = generateHealthRecommendation(stats, meals)
          if (!rec) return null
          const bgClass = rec.priority === 'high' ? 'bg-destructive/10 border-destructive/20' : rec.priority === 'medium' ? 'bg-warning/10 border-warning/20' : 'bg-primary/5 border-primary/20'
          return (
            <section>
              <Card className={`${bgClass}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5 shrink-0">{rec.icon}</span>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground mb-1">💡 Rekomendasi Kesehatan</h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {rec.text}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )
        })()}

        {/* Restaurant Analytics */}
        {vendorAnalytics.allVendorStats.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              🍽️ Analisis Restoran
            </h2>

            {/* Spending Concentration */}
            <div className="mb-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">Spending Concentration</span>
                  </div>
                  <div className="space-y-2">
                    {vendorAnalytics.spendingConcentration.topVendors.slice(0, 3).map(v => (
                      <div key={v.vendor} className="flex items-center justify-between text-sm">
                        <span className="text-foreground truncate">{v.vendor || 'Home'}</span>
                        <span className="text-primary font-semibold">{v.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Top 5 vendors = <span className="font-semibold text-foreground">{vendorAnalytics.spendingConcentration.topNPercentage}%</span> of budget
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* New vs Repeat */}
            <div className="mb-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Compass className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground font-medium">New vs Repeat</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {vendorAnalytics.newVsRepeat.newPercentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">Exploring</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {vendorAnalytics.newVsRepeat.repeatPercentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">Familiar</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {vendorAnalytics.newVsRepeat.uniqueVendors} unique vendors out of {vendorAnalytics.newVsRepeat.totalMeals} meals
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Time to Repeat */}
            {vendorAnalytics.timeToRepeat.length > 0 && (
              <div className="mb-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground font-medium">Time to Repeat</span>
                    </div>
                    <div className="space-y-2">
                      {vendorAnalytics.timeToRepeat.slice(0, 3).map(v => (
                        <div key={v.vendor} className="flex items-center justify-between text-sm">
                          <span className="text-foreground truncate">{v.vendor || 'Home'}</span>
                          <span className="text-muted-foreground">every {v.avgDaysBetween}d</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Day of Week Habits */}
            {vendorAnalytics.dayOfWeekHabits.length > 0 && (
              <div className="mb-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground font-medium">Day of Week Habits</span>
                    </div>
                    <div className="space-y-2">
                      {vendorAnalytics.dayOfWeekHabits.slice(0, 3).map(h => (
                        <div key={h.vendor} className="flex items-center justify-between text-sm">
                          <span className="text-foreground truncate">{h.vendor || 'Home'}</span>
                          <span className="text-muted-foreground text-xs">{h.mostCommonDay}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Vendor Discovery Streak */}
            <div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground font-medium">Restaurant Discovery</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {vendorAnalytics.vendorDiscoveryStreak.uniqueVendors}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    unique restaurants ({vendorAnalytics.vendorDiscoveryStreak.avgNewPerWeek} new/week on avg)
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Weekly Summary */}
        <section>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-foreground mb-1">Ringkasan Mingguan</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {`Periode ini berisi ${meals.length} catatan, total belanja ${formatCurrency(stats?.totalSpending || 0)}, dengan ${stats?.outsideMeals || 0} makan luar/delivery dan ${stats?.homeCookedMeals || 0} masak di rumah.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 7-Day Spending Chart */}
        {timeRange === '7d' && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Pengeluaran 7 Hari Terakhir
            </h2>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-end gap-2 h-32">
                  {dailySpending.map((day, i) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center justify-end h-24">
                        {day.amount > 0 && (
                          <span className="text-[10px] text-muted-foreground mb-1">
                            {Math.round(day.amount / 1000)}k
                          </span>
                        )}
                        <div 
                          className="w-full rounded-t-sm bg-primary transition-all"
                          style={{ 
                            height: `${Math.max((day.amount / maxDailySpending) * 80, 4)}%`,
                            opacity: day.amount > 0 ? 1 : 0.2
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {day.label.split(',')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Food Journal */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Food Journal ({filteredJournalMeals.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJournal(!showJournal)}
            >
              {showJournal ? 'Sembunyikan' : 'Lihat Semua'}
            </Button>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari makanan, tempat, tag..."
              className="pl-9"
            />
          </div>

          {showJournal && (
            <div className="space-y-2">
              {filteredJournalMeals.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Tidak ada hasil' : 'Belum ada catatan makanan'}
                  </p>
                </div>
              ) : (
                filteredJournalMeals.slice(0, 20).map(meal => (
                  <div key={meal.id}>
                    <p className="text-xs text-muted-foreground mb-1 mt-3 first:mt-0">
                      {formatShortDate(meal.date)}
                    </p>
                    <MealCard meal={meal} compact />
                  </div>
                ))
              )}
              {filteredJournalMeals.length > 20 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  + {filteredJournalMeals.length - 20} makanan lainnya
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
