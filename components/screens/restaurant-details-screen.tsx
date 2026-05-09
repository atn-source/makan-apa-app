'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Meal } from '@/lib/types'
import { getRestaurantStats } from '@/lib/restaurant-stats'
import { getMealsFromDb } from '@/lib/meal-database'
import { formatCurrency, MEAL_TYPE_ICONS, MEAL_TYPE_LABELS, SOURCE_LABELS, SOURCE_ICONS } from '@/lib/meal-storage'
import { MealCard } from '@/components/meal-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Star, TrendingUp, Flame, Leaf, Calendar, BarChart3, Search } from 'lucide-react'

interface RestaurantDetailsScreenProps {
  vendor: string
  onBack: () => void
}

export function RestaurantDetailsScreen({ vendor, onBack }: RestaurantDetailsScreenProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMeals() {
      const allMeals = await getMealsFromDb()
      setMeals(allMeals)
      setLoading(false)
    }
    loadMeals()
  }, [])

  const stats = useMemo(() => {
    return getRestaurantStats(vendor, meals)
  }, [vendor, meals])

  const filteredMeals = useMemo(() => {
    if (!searchQuery.trim()) return stats.meals
    const query = searchQuery.toLowerCase()
    return stats.meals.filter(
      m => m.food.toLowerCase().includes(query) || m.notes?.toLowerCase().includes(query)
    )
  }, [stats.meals, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const spendingTrendMax = Math.max(...stats.spendingByMonth.map(m => m.spent), 1)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{vendor || 'Home'}</h1>
            <p className="text-xs text-muted-foreground">{stats.totalMeals} meals • {formatCurrency(stats.totalSpent)} spent</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Key Stats */}
        <section className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Avg Spend</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(stats.avgCost)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Avg Rating</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stats.avgRating.toFixed(1)}/5</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">First Visit</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {new Date(stats.firstVisit).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Last Visit</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {new Date(stats.lastVisit).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Rating Distribution */}
        {Object.values(stats.ratingDistribution).some(v => v > 0) && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Rating Distribution</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = stats.ratingDistribution[rating] || 0
                    const percentage = stats.totalMeals > 0 ? Math.round((count / stats.totalMeals) * 100) : 0
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Health Tags Breakdown */}
        {Object.keys(stats.healthTagBreakdown).length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Health Profile</h2>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.healthTagBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tag, count]) => {
                      const percentage = Math.round((count / stats.totalMeals) * 100)
                      return (
                        <div
                          key={tag}
                          className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                        >
                          {tag} <span className="text-muted-foreground">({percentage}%)</span>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Day of Week Pattern */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Favorite Days</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                  const count = stats.dayOfWeekPattern[['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]] || 0
                  const maxCount = Math.max(...Object.values(stats.dayOfWeekPattern))
                  const height = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
                  return (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <div className="w-full h-16 bg-secondary rounded-sm flex items-end justify-center p-1">
                        <div
                          className="w-full rounded-t-sm bg-primary transition-all"
                          style={{ height: `${Math.max(height, 10)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{day}</span>
                      <span className="text-xs font-semibold text-foreground">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Most Common Meal */}
        {stats.mostCommonMeal && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Favorite Order</h2>
            <Card>
              <CardContent className="p-4">
                <p className="font-semibold text-foreground mb-1">{stats.mostCommonMeal}</p>
                <p className="text-xs text-muted-foreground">{stats.mostCommonMealCount}x ordered</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Spending Trend */}
        {stats.spendingByMonth.length > 1 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Spending Trend</h2>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-end gap-2 h-24">
                  {stats.spendingByMonth.map(month => (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-16 bg-secondary rounded-t-sm flex items-end justify-center">
                        <div
                          className="w-full rounded-t-sm bg-primary"
                          style={{ height: `${Math.max((month.spent / spendingTrendMax) * 100, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{month.month.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Meals List */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">All Meals ({filteredMeals.length})</h2>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari makanan..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {filteredMeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Tidak ada makanan</p>
              </div>
            ) : (
              filteredMeals.map(meal => (
                <div key={meal.id}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {new Date(meal.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                  </p>
                  <MealCard meal={meal} compact />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
