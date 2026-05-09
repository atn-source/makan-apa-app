import type { Meal } from './types'

export interface VendorStats {
  vendor: string
  count: number
  totalSpent: number
  avgCost: number
  avgRating: number
  lastVisit: string
  firstVisit: string
  dayPattern: Record<string, number> // day of week → count
}

export interface VendorAnalytics {
  spendingConcentration: {
    topVendors: Array<{ vendor: string; spent: number; percentage: number }>
    topNPercentage: number
  }
  dayOfWeekHabits: Array<{
    vendor: string
    days: Array<{ day: string; count: number }>
    mostCommonDay: string
  }>
  newVsRepeat: {
    uniqueVendors: number
    totalMeals: number
    repeatPercentage: number
    newPercentage: number
  }
  timeToRepeat: Array<{
    vendor: string
    avgDaysBetween: number
    visitCount: number
  }>
  vendorDiscoveryStreak: {
    uniqueVendors: number
    periodDays: number
    avgNewPerWeek: number
  }
  allVendorStats: VendorStats[]
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function calculateVendorAnalytics(meals: Meal[]): VendorAnalytics {
  if (meals.length === 0) {
    return {
      spendingConcentration: { topVendors: [], topNPercentage: 0 },
      dayOfWeekHabits: [],
      newVsRepeat: { uniqueVendors: 0, totalMeals: 0, repeatPercentage: 0, newPercentage: 0 },
      timeToRepeat: [],
      vendorDiscoveryStreak: { uniqueVendors: 0, periodDays: 0, avgNewPerWeek: 0 },
      allVendorStats: []
    }
  }

  // Build vendor map
  const vendorMap = new Map<string, Meal[]>()
  meals.forEach(meal => {
    const vendor = meal.vendor || meal.source
    if (!vendorMap.has(vendor)) {
      vendorMap.set(vendor, [])
    }
    vendorMap.get(vendor)!.push(meal)
  })

  // 1. SPENDING CONCENTRATION
  const vendorSpending = Array.from(vendorMap.entries()).map(([vendor, vendorMeals]) => {
    const spent = vendorMeals.reduce((sum, m) => sum + (m.cost || 0), 0)
    return { vendor, spent, meals: vendorMeals.length }
  })

  const totalSpent = vendorSpending.reduce((sum, v) => sum + v.spent, 0)
  const spendingByVendor = vendorSpending
    .sort((a, b) => b.spent - a.spent)
    .map(v => ({
      vendor: v.vendor,
      spent: v.spent,
      percentage: Math.round((v.spent / totalSpent) * 100)
    }))

  const topNSpent = spendingByVendor.slice(0, 5).reduce((sum, v) => sum + v.percentage, 0)

  // 2. DAY OF WEEK HABITS
  const dayOfWeekHabits = Array.from(vendorMap.entries())
    .map(([vendor, vendorMeals]) => {
      const dayCount: Record<string, number> = {}
      DAYS_OF_WEEK.forEach(day => (dayCount[day] = 0))

      vendorMeals.forEach(meal => {
        const date = new Date(meal.date)
        const dayName = DAYS_OF_WEEK[date.getDay()]
        dayCount[dayName]++
      })

      const daysWithMeals = DAYS_OF_WEEK.filter(day => dayCount[day] > 0).map(day => ({
        day,
        count: dayCount[day]
      }))

      const mostCommonDay = daysWithMeals.length > 0
        ? daysWithMeals.sort((a, b) => b.count - a.count)[0].day
        : 'N/A'

      return {
        vendor,
        days: daysWithMeals,
        mostCommonDay
      }
    })
    .filter(h => h.days.length > 0)
    .sort((a, b) => {
      const aMax = Math.max(...a.days.map(d => d.count))
      const bMax = Math.max(...b.days.map(d => d.count))
      return bMax - aMax
    })

  // 3. NEW VS REPEAT
  const uniqueVendors = vendorMap.size
  const repeatVendors = Array.from(vendorMap.entries()).filter(([_, meals]) => meals.length > 1).length
  const newVendors = uniqueVendors - repeatVendors

  // 4. TIME TO REPEAT
  const timeToRepeat = Array.from(vendorMap.entries())
    .filter(([_, vendorMeals]) => vendorMeals.length > 1)
    .map(([vendor, vendorMeals]) => {
      const sorted = vendorMeals.sort((a, b) => a.date.localeCompare(b.date))
      let totalDays = 0
      let gaps = 0

      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].date)
        const curr = new Date(sorted[i].date)
        const daysDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
        totalDays += daysDiff
        gaps++
      }

      const avgDaysBetween = gaps > 0 ? Math.round(totalDays / gaps) : 0

      return {
        vendor,
        avgDaysBetween,
        visitCount: vendorMeals.length
      }
    })
    .sort((a, b) => a.avgDaysBetween - b.avgDaysBetween)

  // 5. VENDOR DISCOVERY STREAK
  const periodStart = meals.length > 0 ? new Date(meals[meals.length - 1].date) : new Date()
  const periodEnd = meals.length > 0 ? new Date(meals[0].date) : new Date()
  const periodDays = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const avgNewPerWeek = periodDays > 0 ? Math.round((newVendors / periodDays) * 7) : 0

  // ALL VENDOR STATS
  const allVendorStats: VendorStats[] = Array.from(vendorMap.entries()).map(([vendor, vendorMeals]) => {
    const sorted = vendorMeals.sort((a, b) => a.date.localeCompare(b.date))
    const totalSpent = vendorMeals.reduce((sum, m) => sum + (m.cost || 0), 0)
    const ratedMeals = vendorMeals.filter(m => m.rating)
    const avgRating = ratedMeals.length > 0
      ? Math.round((ratedMeals.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMeals.length) * 10) / 10
      : 0

    const dayCount: Record<string, number> = {}
    DAYS_OF_WEEK.forEach(day => (dayCount[day] = 0))
    vendorMeals.forEach(meal => {
      const date = new Date(meal.date)
      const dayName = DAYS_OF_WEEK[date.getDay()]
      dayCount[dayName]++
    })

    return {
      vendor,
      count: vendorMeals.length,
      totalSpent,
      avgCost: Math.round(totalSpent / vendorMeals.length),
      avgRating,
      lastVisit: sorted[sorted.length - 1].date,
      firstVisit: sorted[0].date,
      dayPattern: dayCount
    }
  })

  return {
    spendingConcentration: {
      topVendors: spendingByVendor.slice(0, 5),
      topNPercentage: topNSpent
    },
    dayOfWeekHabits: dayOfWeekHabits.slice(0, 5),
    newVsRepeat: {
      uniqueVendors,
      totalMeals: meals.length,
      repeatPercentage: Math.round((repeatVendors / uniqueVendors) * 100),
      newPercentage: Math.round((newVendors / uniqueVendors) * 100)
    },
    timeToRepeat,
    vendorDiscoveryStreak: {
      uniqueVendors,
      periodDays,
      avgNewPerWeek
    },
    allVendorStats: allVendorStats.sort((a, b) => b.count - a.count)
  }
}
