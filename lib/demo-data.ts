import type { Meal } from './types'
import { saveMeal, getMeals, generateId, getDaysAgo, getToday, clearAllMeals } from './meal-storage'

const DEMO_DATA_DISABLED_KEY = 'makan-apa-demo-disabled'

const DEMO_MEALS: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    date: getToday(),
    mealType: 'breakfast',
    food: 'Nasi Uduk',
    source: 'takeout',
    vendor: 'Warung Bu Siti',
    cost: 15000,
    rating: 4,
    tags: ['fried']
  },
  {
    date: getDaysAgo(1),
    mealType: 'lunch',
    food: 'Nasi Goreng Ayam',
    source: 'home',
    cost: 25000,
    rating: 5,
    tags: ['fried']
  },
  {
    date: getDaysAgo(1),
    mealType: 'dinner',
    food: 'Sate Ayam',
    source: 'dine-out',
    vendor: 'Sate Pak Minto',
    cost: 45000,
    rating: 5,
    notes: 'Sate terenak di Jogja!'
  },
  {
    date: getDaysAgo(2),
    mealType: 'lunch',
    food: 'Gado-gado',
    source: 'takeout',
    vendor: 'Gado-gado Boplo',
    cost: 25000,
    rating: 4,
    tags: ['vegetable', 'healthy']
  },
  {
    date: getDaysAgo(2),
    mealType: 'dinner',
    food: 'Ayam Bakar',
    source: 'delivery',
    vendor: 'Ayam Bakar Taliwang',
    cost: 55000,
    rating: 4,
    tags: ['spicy']
  },
  {
    date: getDaysAgo(3),
    mealType: 'breakfast',
    food: 'Bubur Ayam',
    source: 'takeout',
    vendor: 'Bubur Ayam Mang Oyo',
    cost: 18000,
    rating: 4
  },
  {
    date: getDaysAgo(3),
    mealType: 'lunch',
    food: 'Pecel Lele',
    source: 'dine-out',
    vendor: 'Pecel Lele Lela',
    cost: 30000,
    rating: 3,
    tags: ['fried']
  },
  {
    date: getDaysAgo(4),
    mealType: 'dinner',
    food: 'Sop Buntut',
    source: 'dine-out',
    vendor: 'Sop Buntut Bogor Cafe',
    cost: 85000,
    rating: 5,
    notes: 'Special dinner with family'
  },
  {
    date: getDaysAgo(5),
    mealType: 'lunch',
    food: 'Mie Ayam',
    source: 'takeout',
    vendor: 'Mie Ayam Bakso Pak Kumis',
    cost: 20000,
    rating: 4
  },
  {
    date: getDaysAgo(5),
    mealType: 'dinner',
    food: 'Rendang Padang',
    source: 'delivery',
    vendor: 'RM Padang Sederhana',
    cost: 45000,
    rating: 5,
    tags: ['spicy']
  },
  {
    date: getDaysAgo(6),
    mealType: 'breakfast',
    food: 'Roti Bakar',
    source: 'home',
    cost: 10000,
    rating: 3
  },
  {
    date: getDaysAgo(6),
    mealType: 'lunch',
    food: 'Sayur Asem',
    source: 'home',
    cost: 15000,
    rating: 4,
    tags: ['vegetable', 'healthy']
  }
]

export function loadDemoData(): void {
  if (typeof window !== 'undefined' && localStorage.getItem(DEMO_DATA_DISABLED_KEY) === 'true') return

  // Only load demo data if no meals exist
  const existingMeals = getMeals()
  if (existingMeals.length > 0) return

  const now = new Date().toISOString()
  
  DEMO_MEALS.forEach(mealData => {
    const meal: Meal = {
      ...mealData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    }
    saveMeal(meal)
  })
}

export function clearAllData(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_DATA_DISABLED_KEY, 'true')
  }
  clearAllMeals()
}

export function restoreDemoData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_DATA_DISABLED_KEY)
  }
  clearAllMeals()
  loadDemoData()
}
