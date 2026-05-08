import type { Meal } from "./types"
import { supabase } from "./supabase"

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
    mealType: row.meal_type as Meal["mealType"],
    food: row.food,
    source: row.source as Meal["source"],
    vendor: row.vendor || undefined,
    cost: row.cost || 0,
    rating: row.rating || undefined,
    notes: row.notes || undefined,
    tags: row.tags || [],
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

export async function getMealsForDateRangeFromDb(
  startDate: string,
  endDate: string
): Promise<Meal[]> {
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

  return fromRow(data)
}

export async function updateMealInDb(
  id: string,
  meal: Partial<Meal>
): Promise<Meal | null> {
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