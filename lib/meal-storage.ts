import type { Meal, MealStats, MealRecommendation, MealType, MealSource } from './types'

const STORAGE_KEY = 'makan-apa-meals'

export function getMeals(): Meal[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveMeal(meal: Meal): void {
  const meals = getMeals()
  const existingIndex = meals.findIndex(m => m.id === meal.id)
  
  if (existingIndex >= 0) {
    meals[existingIndex] = { ...meal, updatedAt: new Date().toISOString() }
  } else {
    meals.push(meal)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals))
}

export function deleteMeal(id: string): void {
  const meals = getMeals().filter(m => m.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals))
}

export function clearAllMeals(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function getMealsForDate(date: string): Meal[] {
  return getMeals().filter(m => m.date === date)
}

export function getMealsForDateRange(startDate: string, endDate: string): Meal[] {
  return getMeals().filter(m => m.date >= startDate && m.date <= endDate)
}

export function calculateStats(meals: Meal[]): MealStats {
  const totalSpending = meals.reduce((sum, m) => sum + (m.cost || 0), 0)
  const outsideMeals = meals.filter(m => m.source !== 'home').length
  const homeCookedMeals = meals.filter(m => m.source === 'home').length
  const friedMeals = meals.filter(m => 
    m.tags?.includes('fried') || 
    m.food.toLowerCase().includes('goreng') ||
    m.food.toLowerCase().includes('fried') ||
    m.food.toLowerCase().includes('geprek')
  ).length
  const vegetableMeals = meals.filter(m => 
    m.tags?.includes('vegetable') || 
    m.food.toLowerCase().includes('sayur') ||
    m.food.toLowerCase().includes('vegetable') ||
    m.food.toLowerCase().includes('salad') ||
    m.food.toLowerCase().includes('gado') ||
    m.food.toLowerCase().includes('capcay')
  ).length
  
  const ratedMeals = meals.filter(m => m.rating)
  const avgRating = ratedMeals.length > 0 
    ? ratedMeals.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMeals.length 
    : 0
  
  return {
    totalSpending,
    outsideMeals,
    homeCookedMeals,
    friedMeals,
    vegetableMeals,
    avgRating
  }
}

export function getRecommendations(maxBudget?: number): MealRecommendation[] {
  const meals = getMeals()
  const foodMap = new Map<string, {
    meals: Meal[]
    lastEaten: string
    sources: Set<MealSource>
    vendors: Set<string>
  }>()
  
  meals.forEach(meal => {
    const foodKey = meal.food.toLowerCase().trim()
    const existing = foodMap.get(foodKey)
    
    if (existing) {
      existing.meals.push(meal)
      if (meal.date > existing.lastEaten) existing.lastEaten = meal.date
      existing.sources.add(meal.source)
      if (meal.vendor) existing.vendors.add(meal.vendor)
    } else {
      foodMap.set(foodKey, {
        meals: [meal],
        lastEaten: meal.date,
        sources: new Set([meal.source]),
        vendors: new Set(meal.vendor ? [meal.vendor] : [])
      })
    }
  })
  
  const today = new Date()
  const recommendations: MealRecommendation[] = []
  
  foodMap.forEach((data) => {
    const { meals: foodMeals, lastEaten, sources, vendors } = data
    const avgCost = foodMeals.reduce((sum, m) => sum + (m.cost || 0), 0) / foodMeals.length
    const ratedMeals = foodMeals.filter(m => m.rating)
    const avgRating = ratedMeals.length > 0 
      ? ratedMeals.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMeals.length 
      : 3
    
    if (maxBudget && avgCost > maxBudget) return
    
    const lastEatenDate = new Date(lastEaten)
    const daysSinceEaten = Math.floor((today.getTime() - lastEatenDate.getTime()) / (1000 * 60 * 60 * 24))
    const recencyScore = Math.min(daysSinceEaten / 7, 2)
    const ratingScore = avgRating
    const frequencyPenalty = Math.min(foodMeals.length / 10, 1)
    const score = (recencyScore * 2) + ratingScore - frequencyPenalty
    
    recommendations.push({
      food: foodMeals[0].food,
      lastEaten,
      timesEaten: foodMeals.length,
      avgRating: Math.round(avgRating * 10) / 10,
      avgCost: Math.round(avgCost),
      sources: Array.from(sources),
      vendors: Array.from(vendors),
      score
    })
  })
  
  return recommendations.sort((a, b) => b.score - a.score)
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map(word => word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase())
    .join(' ')
}

function parseCost(input: string): { cost?: number; matchedText?: string } {
  const regex = /(?:rp\.?\s*)?(\d+(?:[\.,]\d+)?)(?:\s*)(k|rb|ribu|jt|juta|000)?/gi
  let match: RegExpExecArray | null
  let best: { cost?: number; matchedText?: string } = {}

  while ((match = regex.exec(input)) !== null) {
    const full = match[0]
    const number = Number(match[1].replace(',', '.'))
    const unit = match[2]?.toLowerCase()
    const hasRp = /^\s*rp/i.test(full)
    const hasUnit = Boolean(unit)
    let cost = number

    if (['k', 'rb', 'ribu'].includes(unit || '')) cost = number * 1000
    else if (['jt', 'juta'].includes(unit || '')) cost = number * 1000000
    else if (unit === '000') cost = number * 1000

    if (!hasRp && !hasUnit && cost < 1000) continue
    if (cost >= 1000 && cost <= 10000000) best = { cost: Math.round(cost), matchedText: full }
  }

  return best
}

// Parse natural language meal input. Designed for practical Indonesian/English daily logging.
export function parseQuickMeal(input: string): Partial<Meal> {
  const result: Partial<Meal> = {}
  const lowerInput = input.toLowerCase()
  
  if (/\b(breakfast|sarapan|pagi)\b/i.test(input)) result.mealType = 'breakfast'
  else if (/\b(lunch|makan siang|siang)\b/i.test(input)) result.mealType = 'lunch'
  else if (/\b(dinner|makan malam|malam)\b/i.test(input)) result.mealType = 'dinner'
  else if (/\b(snack|cemilan|camilan)\b/i.test(input)) result.mealType = 'snack'
  
  if (/\b(delivery|gofood|gojek|grabfood|grab|shopeefood|antar|dikirim|pesan online|ojol)\b/i.test(input)) result.source = 'delivery'
  else if (/\b(takeout|take away|bungkus|dibungkus|beli bungkus)\b/i.test(input)) result.source = 'takeout'
  else if (/\b(dine|dine-out|eat out|restaurant|resto|makan di|di mall|food court)\b/i.test(input)) result.source = 'dine-out'
  else if (/\b(home|rumah|masak|masakan rumah|di rumah)\b/i.test(input)) result.source = 'home'
  
  const parsedCost = parseCost(input)
  if (parsedCost.cost) result.cost = parsedCost.cost
  
  if (/\b(tidak enak|ga enak|nggak enak|bad|jelek|parah)\b/i.test(input)) result.rating = 1
  else if (/\b(kurang|not good|meh)\b/i.test(input)) result.rating = 2
  else if (/\b(lumayan|ok|okay|biasa)\b/i.test(input)) result.rating = 3
  else if (/\b(enak banget|mantap|excellent|favorit|favorite|terbaik)\b/i.test(input)) result.rating = 5
  else if (/\b(enak|sedap|good|bagus|suka)\b/i.test(input)) result.rating = 4
  
  const tags: string[] = []
  if (/\b(goreng|fried|geprek|lele)\b/i.test(input)) tags.push('fried')
  if (/\b(sayur|vegetable|salad|gado|capcay|kangkung|bayam)\b/i.test(input)) tags.push('vegetable')
  if (/\b(pedas|spicy|sambal|mercon)\b/i.test(input)) tags.push('spicy')
  if (/\b(manis|sweet|dessert|es teh|boba)\b/i.test(input)) tags.push('sweet')
  if (/\b(sehat|healthy|light|ringan)\b/i.test(input)) tags.push('healthy')
  if (tags.length > 0) result.tags = Array.from(new Set(tags))
  
  let foodName = input
  const removePatterns = [
    /\b(breakfast|lunch|dinner|snack|sarapan|makan siang|makan malam|cemilan|camilan|pagi|siang|malam)\b/gi,
    /\b(takeout|take away|delivery|dine-out|eat out|home|bungkus|dibungkus|beli bungkus|gofood|gojek|grabfood|grab|shopeefood|antar|dikirim|pesan online|ojol|rumah|masak|masakan rumah|resto|restaurant|makan di|di rumah|di mall|food court)\b/gi,
    /\b(enak banget|tidak enak|ga enak|nggak enak|mantap|excellent|favorit|favorite|terbaik|enak|sedap|good|bagus|suka|lumayan|ok|okay|biasa|kurang|not good|bad|jelek|parah|meh)\b/gi,
  ]

  if (parsedCost.matchedText) foodName = foodName.replace(parsedCost.matchedText, '')
  removePatterns.forEach(pattern => { foodName = foodName.replace(pattern, '') })
  foodName = foodName.replace(/[,:;|]+/g, ' ').replace(/\s+/g, ' ').trim()
  
  if (foodName) result.food = titleCase(foodName)
  return result
}

export function duplicateMealForDate(meal: Meal, date = getToday(), mealType: MealType = meal.mealType): Meal {
  const now = new Date().toISOString()
  const copiedMeal: Meal = {
    ...meal,
    id: generateId(),
    date,
    mealType,
    notes: meal.notes ? `${meal.notes} | Repeated meal` : 'Repeated meal',
    createdAt: now,
    updatedAt: now
  }
  saveMeal(copiedMeal)
  return copiedMeal
}

export function getLastMealForType(mealType?: MealType): Meal | undefined {
  const meals = getMeals()
    .filter(meal => !mealType || meal.mealType === mealType)
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`))
  return meals[0]
}

function csvEscape(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function generateMealsCsv(meals = getMeals()): string {
  const headers = ['date', 'mealType', 'food', 'source', 'vendor', 'cost', 'rating', 'tags', 'notes', 'createdAt', 'updatedAt']
  const rows = meals
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`))
    .map(meal => [
      meal.date,
      MEAL_TYPE_LABELS[meal.mealType],
      meal.food,
      SOURCE_LABELS[meal.source],
      meal.vendor || '',
      meal.cost || '',
      meal.rating || '',
      meal.tags?.join('|') || '',
      meal.notes || '',
      meal.createdAt,
      meal.updatedAt
    ].map(csvEscape).join(','))

  return [headers.map(csvEscape).join(','), ...rows].join('\n')
}

export function downloadMealsCsv(filename = `makan-apa-journal-${getToday()}.csv`): void {
  if (typeof window === 'undefined') return
  const csv = generateMealsCsv()
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getWeeklySummary(days = 7): string {
  const meals = getMealsForDateRange(getDaysAgo(days), getToday())
  if (meals.length === 0) return `Belum ada catatan makanan dalam ${days} hari terakhir.`

  const stats = calculateStats(meals)
  const frequency = meals.reduce<Record<string, number>>((acc, meal) => {
    acc[meal.food] = (acc[meal.food] || 0) + 1
    return acc
  }, {})
  const mostRepeated = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]
  const avgPerMeal = meals.length > 0 ? Math.round(stats.totalSpending / meals.length) : 0

  return `Dalam ${days} hari terakhir: ${meals.length} makanan tercatat, total pengeluaran ${formatCurrency(stats.totalSpending)}, rata-rata ${formatCurrency(avgPerMeal)} per makan, ${stats.outsideMeals} kali makan luar/delivery, ${stats.homeCookedMeals} kali masak sendiri${mostRepeated ? `, paling sering: ${mostRepeated[0]} (${mostRepeated[1]}x)` : ''}.`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Cemilan'
}

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿'
}

export const SOURCE_LABELS: Record<MealSource, string> = {
  home: 'Masak Sendiri',
  takeout: 'Bungkus',
  'dine-out': 'Makan di Tempat',
  delivery: 'Delivery'
}

export const SOURCE_ICONS: Record<MealSource, string> = {
  home: '🏠',
  takeout: '📦',
  'dine-out': '🍽️',
  delivery: '🛵'
}
