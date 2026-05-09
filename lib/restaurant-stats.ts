import type { Meal } from './types'

export interface RestaurantStats {
  vendor: string
  meals: Meal[]
  totalMeals: number
  totalSpent: number
  avgCost: number
  avgRating: number
  ratingDistribution: Record<number, number> // 1-5 star counts
  healthTagBreakdown: Record<string, number> // tag -> count
  dayOfWeekPattern: Record<string, number>
  spendingByMonth: Array<{ month: string; spent: number; count: number }>
  firstVisit: string
  lastVisit: string
  mostCommonMeal: string | null
  mostCommonMealCount: number
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getRestaurantStats(vendor: string, meals: Meal[]): RestaurantStats {
  const vendorMeals = meals.filter(m => (m.vendor || m.source) === vendor).sort((a, b) => a.date.localeCompare(b.date))

  // Basic stats
  const totalMeals = vendorMeals.length
  const totalSpent = vendorMeals.reduce((sum, m) => sum + (m.cost || 0), 0)
  const avgCost = totalMeals > 0 ? Math.round(totalSpent / totalMeals) : 0

  const ratedMeals = vendorMeals.filter(m => m.rating)
  const avgRating = ratedMeals.length > 0
    ? Math.round((ratedMeals.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMeals.length) * 10) / 10
    : 0

  // Rating distribution
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratedMeals.forEach(m => {
    if (m.rating) ratingDistribution[m.rating]++
  })

  // Health tag breakdown
  const healthTagBreakdown: Record<string, number> = {}
  vendorMeals.forEach(m => {
    if (m.tags) {
      m.tags.forEach(tag => {
        healthTagBreakdown[tag] = (healthTagBreakdown[tag] || 0) + 1
      })
    }
  })

  // Day of week pattern
  const dayOfWeekPattern: Record<string, number> = {}
  DAYS_OF_WEEK.forEach(day => (dayOfWeekPattern[day] = 0))
  vendorMeals.forEach(m => {
    const date = new Date(m.date)
    const dayName = DAYS_OF_WEEK[date.getDay()]
    dayOfWeekPattern[dayName]++
  })

  // Spending by month
  const spendingByMonth: Record<string, { spent: number; count: number }> = {}
  vendorMeals.forEach(m => {
    const date = new Date(m.date)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
    if (!spendingByMonth[monthKey]) {
      spendingByMonth[monthKey] = { spent: 0, count: 0 }
    }
    spendingByMonth[monthKey].spent += m.cost || 0
    spendingByMonth[monthKey].count++
  })

  const spendingByMonthArray = Object.entries(spendingByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      spent: data.spent,
      count: data.count
    }))

  // Most common meal
  const mealFrequency: Record<string, number> = {}
  vendorMeals.forEach(m => {
    mealFrequency[m.food] = (mealFrequency[m.food] || 0) + 1
  })
  const mostCommonMealEntry = Object.entries(mealFrequency).sort((a, b) => b[1] - a[1])[0]
  const mostCommonMeal = mostCommonMealEntry?.[0] || null
  const mostCommonMealCount = mostCommonMealEntry?.[1] || 0

  return {
    vendor,
    meals: vendorMeals,
    totalMeals,
    totalSpent,
    avgCost,
    avgRating,
    ratingDistribution,
    healthTagBreakdown,
    dayOfWeekPattern,
    spendingByMonth: spendingByMonthArray,
    firstVisit: vendorMeals[0]?.date || new Date().toISOString().split('T')[0],
    lastVisit: vendorMeals[vendorMeals.length - 1]?.date || new Date().toISOString().split('T')[0],
    mostCommonMeal,
    mostCommonMealCount
  }
}
