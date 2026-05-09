import type { Meal, MealStats } from './types'

export interface HealthRecommendation {
  text: string
  icon: string
  priority: 'high' | 'medium' | 'low'
  category: 'fried' | 'vegetable' | 'sugary' | 'calorie' | 'variety' | 'delivery' | 'balanced'
}

export function generateHealthRecommendation(stats: MealStats, meals: Meal[]): HealthRecommendation | null {
  const totalMeals = meals.length

  if (totalMeals === 0) {
    return {
      text: 'Mulai catat makanan harian Anda untuk mendapat rekomendasi kesehatan',
      icon: '📝',
      priority: 'low',
      category: 'balanced'
    }
  }

  const friedRatio = stats.friedMeals / totalMeals
  const vegRatio = stats.vegetableMeals / totalMeals
  const sugaryRatio = stats.sugaryDrinks / totalMeals
  const highCalRatio = stats.highCalorieMeals / totalMeals
  const deliveryRatio = stats.deliveryFrequency / totalMeals
  const proteinCount = stats.proteinVariety.length

  // High priority issues
  if (friedRatio > 0.4) {
    return {
      text: 'Kurangi makanan goreng. Sudah ' + stats.friedMeals + ' kali minggu ini.',
      icon: '🍟',
      priority: 'high',
      category: 'fried'
    }
  }

  if (sugaryRatio > 0.3) {
    return {
      text: 'Banyak minuman manis (' + stats.sugaryDrinks + 'x). Ganti dengan air atau teh tawar.',
      icon: '🥤',
      priority: 'high',
      category: 'sugary'
    }
  }

  if (highCalRatio > 0.5) {
    return {
      text: 'Banyak makanan tinggi kalori. Coba pilihan yang lebih ringan.',
      icon: '⚖️',
      priority: 'high',
      category: 'calorie'
    }
  }

  // Medium priority issues
  if (vegRatio < 0.25 && totalMeals >= 5) {
    return {
      text: 'Tambahkan makanan berkuah atau berkuah sayur—hanya ' + stats.vegetableMeals + ' kali minggu ini.',
      icon: '🥬',
      priority: 'medium',
      category: 'vegetable'
    }
  }

  if (proteinCount < 2 && totalMeals >= 5) {
    return {
      text: 'Tambah variasi protein: coba ikan, tahu, atau seafood.',
      icon: '🍗',
      priority: 'medium',
      category: 'variety'
    }
  }

  if (deliveryRatio > 0.5) {
    return {
      text: 'Sering delivery. Coba masak atau beli makanan rumahan—lebih hemat & sehat.',
      icon: '👨‍🍳',
      priority: 'medium',
      category: 'delivery'
    }
  }

  // Low priority / positive reinforcement
  if (stats.homeCookedMeals >= 3) {
    return {
      text: 'Bagus! Sudah ' + stats.homeCookedMeals + 'x masak sendiri minggu ini.',
      icon: '👍',
      priority: 'low',
      category: 'balanced'
    }
  }

  if (vegRatio > 0.3 && friedRatio < 0.3) {
    return {
      text: 'Keseimbangan makanan sudah baik. Pertahankan!',
      icon: '✨',
      priority: 'low',
      category: 'balanced'
    }
  }

  return {
    text: 'Terus catat makanan untuk insight yang lebih baik.',
    icon: '📊',
    priority: 'low',
    category: 'balanced'
  }
}
