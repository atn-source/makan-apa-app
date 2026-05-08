import type { Meal, MealRecommendation, MealSource, MealType } from "./types"
import { supabase } from "./supabase"
import { getToday } from "./meal-storage"

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

function fromRow(row: SupabaseMealRow): Meal {
  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type as MealType,
    food: row.food,
    source: row.source as MealSource,
    vendor: row.vendor || undefined,
    cost: row.cost || undefined,
    rating: row.rating || undefined,
    notes: row.notes || undefined,
    tags: row.tags || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(meal: Partial<Meal>) {
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

  return ((data || []) as SupabaseMealRow[]).map(fromRow)
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

  return ((data || []) as SupabaseMealRow[]).map(fromRow)
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

  return ((data || []) as SupabaseMealRow[]).map(fromRow)
}

export async function saveMealToDb(meal: Partial<Meal>): Promise<Meal | null> {
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

  return fromRow(data as SupabaseMealRow)
}

export async function updateMealInDb(id: string, meal: Partial<Meal>): Promise<Meal | null> {
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

  return fromRow(data as SupabaseMealRow)
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

export async function getLastMealForTypeFromDb(mealType?: MealType): Promise<Meal | undefined> {
  let query = supabase.from("meals").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(1)
  if (mealType) query = query.eq("meal_type", mealType)
  const { data, error } = await query
  if (error) {
    console.error("Error fetching last meal:", error)
    return undefined
  }
  const row = (data || [])[0] as SupabaseMealRow | undefined
  return row ? fromRow(row) : undefined
}

export async function duplicateMealForDateFromDb(meal: Meal, date = getToday(), mealType: MealType = meal.mealType): Promise<Meal | null> {
  return saveMealToDb({
    date,
    mealType,
    food: meal.food,
    source: meal.source,
    vendor: meal.vendor,
    cost: meal.cost,
    rating: meal.rating,
    notes: meal.notes ? `${meal.notes} | Repeated meal` : "Repeated meal",
    tags: meal.tags,
  })
}

export async function getRecommendationsFromDb(maxBudget?: number): Promise<MealRecommendation[]> {
  const meals = await getMealsFromDb()
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
