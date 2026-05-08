import type { Meal, MealRecommendation, MealSource, MealStats } from "./types"
import { supabase } from "./supabase"
import {
  formatCurrency,
  getDaysAgo,
  getToday,
  MEAL_TYPE_LABELS,
  SOURCE_LABELS,
} from "./meal-storage"

type SupabaseMealRow = {
  id: string
  date: string
  meal_type: string
  food: string
  source: string
  vendor: string | null
  cost: number | null
  rating: number | null
  notes: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

type MealInput = Partial<Omit<Meal, "id" | "createdAt" | "updatedAt">>

function fromRow(row: SupabaseMealRow): Meal {
  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type as Meal["mealType"],
    food: row.food,
    source: row.source as Meal["source"],
    vendor: row.vendor || undefined,
    cost: row.cost || undefined,
    rating: row.rating || undefined,
    notes: row.notes || undefined,
    tags: row.tags || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(meal: MealInput) {
  return {
    date: meal.date,
    meal_type: meal.mealType,
    food: meal.food,
    source: meal.source,
    vendor: meal.vendor || null,
    cost: meal.cost || 0,
    rating: meal.rating || null,
    notes: meal.notes || null,
    tags: meal.tags || [],
    updated_at: new Date().toISOString(),
  }
}

export async function getMealsFromDb(): Promise<Meal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching meals:", error)
    return []
  }

  return (data || []).map(fromRow)
}

export async function getMealsForDateFromDb(date: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("date", date)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching meals for date:", error)
    return []
  }

  return (data || []).map(fromRow)
}

export async function getMealsForDateRangeFromDb(startDate: string, endDate: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching meals for range:", error)
    return []
  }

  return (data || []).map(fromRow)
}

export async function saveMealToDb(meal: MealInput): Promise<Meal | null> {
  const now = new Date().toISOString()
  const payload = {
    ...toRow(meal),
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from("meals")
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error("Error saving meal:", error)
    return null
  }

  return fromRow(data)
}

export async function updateMealInDb(id: string, meal: MealInput): Promise<Meal | null> {
  const { data, error } = await supabase
    .from("meals")
    .update(toRow(meal))
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating meal:", error)
    return null
  }

  return fromRow(data)
}

export async function deleteMealFromDb(id: string): Promise<boolean> {
  const { error } = await supabase.from("meals").delete().eq("id", id)

  if (error) {
    console.error("Error deleting meal:", error)
    return false
  }

  return true
}

export async function clearAllMealsFromDb(): Promise<boolean> {
  const { error } = await supabase.from("meals").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (error) {
    console.error("Error clearing meals:", error)
    return false
  }
  return true
}

export async function getLastMealForTypeFromDb(mealType?: Meal["mealType"]): Promise<Meal | undefined> {
  const query = supabase
    .from("meals")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (mealType) query.eq("meal_type", mealType)

  const { data, error } = await query
  if (error) {
    console.error("Error fetching last meal:", error)
    return undefined
  }
  return data?.[0] ? fromRow(data[0]) : undefined
}

export async function duplicateMealForDateInDb(
  meal: Meal,
  date = getToday(),
  mealType: Meal["mealType"] = meal.mealType
): Promise<Meal | null> {
  return saveMealToDb({
    date,
    mealType,
    food: meal.food,
    source: meal.source,
    vendor: meal.vendor,
    cost: meal.cost,
    rating: meal.rating,
    tags: meal.tags,
    notes: meal.notes ? `${meal.notes} | Repeated meal` : "Repeated meal",
  })
}

export function calculateStatsFromMeals(meals: Meal[]): MealStats {
  const totalSpending = meals.reduce((sum, m) => sum + (m.cost || 0), 0)
  const outsideMeals = meals.filter(m => m.source !== "home").length
  const homeCookedMeals = meals.filter(m => m.source === "home").length
  const friedMeals = meals.filter(m =>
    m.tags?.includes("fried") ||
    m.food.toLowerCase().includes("goreng") ||
    m.food.toLowerCase().includes("fried") ||
    m.food.toLowerCase().includes("geprek")
  ).length
  const vegetableMeals = meals.filter(m =>
    m.tags?.includes("vegetable") ||
    m.food.toLowerCase().includes("sayur") ||
    m.food.toLowerCase().includes("vegetable") ||
    m.food.toLowerCase().includes("salad") ||
    m.food.toLowerCase().includes("gado") ||
    m.food.toLowerCase().includes("capcay")
  ).length
  const ratedMeals = meals.filter(m => m.rating)
  const avgRating = ratedMeals.length > 0
    ? ratedMeals.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMeals.length
    : 0

  return { totalSpending, outsideMeals, homeCookedMeals, friedMeals, vegetableMeals, avgRating }
}

export function generateMealsCsvFromMeals(meals: Meal[]): string {
  const headers = ["date", "mealType", "food", "source", "vendor", "cost", "rating", "tags", "notes", "createdAt", "updatedAt"]
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`
  const rows = [...meals]
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`))
    .map(meal => [
      meal.date,
      MEAL_TYPE_LABELS[meal.mealType],
      meal.food,
      SOURCE_LABELS[meal.source],
      meal.vendor || "",
      meal.cost || "",
      meal.rating || "",
      meal.tags?.join("|") || "",
      meal.notes || "",
      meal.createdAt,
      meal.updatedAt,
    ].map(escape).join(","))
  return [headers.map(escape).join(","), ...rows].join("\n")
}

export function downloadMealsCsvFromMeals(meals: Meal[], filename = `makan-apa-journal-${getToday()}.csv`): void {
  if (typeof window === "undefined") return
  const csv = generateMealsCsvFromMeals(meals)
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getWeeklySummaryFromMeals(meals: Meal[], days = 7): string {
  if (meals.length === 0) return `Belum ada catatan makanan dalam ${days} hari terakhir.`
  const stats = calculateStatsFromMeals(meals)
  const frequency = meals.reduce<Record<string, number>>((acc, meal) => {
    acc[meal.food] = (acc[meal.food] || 0) + 1
    return acc
  }, {})
  const mostRepeated = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]
  const avgPerMeal = meals.length > 0 ? Math.round(stats.totalSpending / meals.length) : 0

  return `Dalam ${days} hari terakhir: ${meals.length} makanan tercatat, total pengeluaran ${formatCurrency(stats.totalSpending)}, rata-rata ${formatCurrency(avgPerMeal)} per makan, ${stats.outsideMeals} kali makan luar/delivery, ${stats.homeCookedMeals} kali masak sendiri${mostRepeated ? `, paling sering: ${mostRepeated[0]} (${mostRepeated[1]}x)` : ""}.`
}

function buildRecommendations(meals: Meal[], maxBudget?: number): MealRecommendation[] {
  const foodMap = new Map<string, { meals: Meal[]; lastEaten: string; sources: Set<MealSource>; vendors: Set<string> }>()

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
        vendors: new Set(meal.vendor ? [meal.vendor] : []),
      })
    }
  })

  const today = new Date()
  const recommendations: MealRecommendation[] = []

  foodMap.forEach(data => {
    const avgCost = data.meals.reduce((sum, m) => sum + (m.cost || 0), 0) / data.meals.length
    const ratedMeals = data.meals.filter(m => m.rating)
    const avgRating = ratedMeals.length > 0
      ? ratedMeals.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMeals.length
      : 3

    if (maxBudget && avgCost > maxBudget) return

    const lastEatenDate = new Date(data.lastEaten)
    const daysSinceEaten = Math.floor((today.getTime() - lastEatenDate.getTime()) / (1000 * 60 * 60 * 24))
    const recencyScore = Math.min(daysSinceEaten / 7, 2)
    const ratingScore = avgRating
    const frequencyPenalty = Math.min(data.meals.length / 10, 1)
    const score = (recencyScore * 2) + ratingScore - frequencyPenalty

    recommendations.push({
      food: data.meals[0].food,
      lastEaten: data.lastEaten,
      timesEaten: data.meals.length,
      avgRating: Math.round(avgRating * 10) / 10,
      avgCost: Math.round(avgCost),
      sources: Array.from(data.sources),
      vendors: Array.from(data.vendors),
      score,
    })
  })

  return recommendations.sort((a, b) => b.score - a.score)
}

export async function getRecommendationsFromDb(maxBudget?: number): Promise<MealRecommendation[]> {
  const meals = await getMealsFromDb()
  return buildRecommendations(meals, maxBudget)
}

const DEMO_MEALS: MealInput[] = [
  { date: getToday(), mealType: "breakfast", food: "Nasi Uduk", source: "takeout", vendor: "Warung Bu Siti", cost: 15000, rating: 4, tags: ["fried"] },
  { date: getDaysAgo(1), mealType: "lunch", food: "Nasi Goreng Ayam", source: "home", cost: 25000, rating: 5, tags: ["fried"] },
  { date: getDaysAgo(1), mealType: "dinner", food: "Sate Ayam", source: "dine-out", vendor: "Sate Pak Minto", cost: 45000, rating: 5, notes: "Sate terenak di Jogja!" },
  { date: getDaysAgo(2), mealType: "lunch", food: "Gado-gado", source: "takeout", vendor: "Gado-gado Boplo", cost: 25000, rating: 4, tags: ["vegetable", "healthy"] },
  { date: getDaysAgo(2), mealType: "dinner", food: "Ayam Bakar", source: "delivery", vendor: "Ayam Bakar Taliwang", cost: 55000, rating: 4, tags: ["spicy"] },
]

export async function restoreDemoMealsToDb(): Promise<void> {
  await clearAllMealsFromDb()
  for (const meal of DEMO_MEALS) {
    await saveMealToDb(meal)
  }
}
