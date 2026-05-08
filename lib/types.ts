export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealSource = 'home' | 'takeout' | 'dine-out' | 'delivery'

export interface Meal {
  id: string
  date: string // ISO date string YYYY-MM-DD
  mealType: MealType
  food: string
  source: MealSource
  vendor?: string
  cost?: number
  rating?: number // 1-5
  notes?: string
  tags?: string[] // e.g., ['fried', 'vegetable', 'spicy']
  createdAt: string
  updatedAt: string
}

export interface MealStats {
  totalSpending: number
  outsideMeals: number
  homeCookedMeals: number
  friedMeals: number
  vegetableMeals: number
  avgRating: number
}

export interface MealRecommendation {
  food: string
  lastEaten: string
  timesEaten: number
  avgRating: number
  avgCost: number
  sources: MealSource[]
  vendors: string[]
  score: number
}
