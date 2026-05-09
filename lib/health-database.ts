export type CalorieLevel = 'low' | 'medium' | 'high'
export type ProteinType = 'chicken' | 'beef' | 'fish' | 'pork' | 'seafood' | 'egg' | 'tofu' | 'tempeh' | 'vegetarian'

export interface HealthAttributes {
  tags: string[]
  calorieLevel: CalorieLevel
  protein?: ProteinType
}

// Common Indonesian and Southeast Asian meals with health attributes
const MEAL_HEALTH_MAP: Record<string, HealthAttributes> = {
  // Fried chicken
  'ayam goreng': { tags: ['fried', 'chicken', 'protein'], calorieLevel: 'high', protein: 'chicken' },
  'ayam geprek': { tags: ['fried', 'chicken', 'protein'], calorieLevel: 'high', protein: 'chicken' },
  'chicken': { tags: ['chicken', 'protein'], calorieLevel: 'medium', protein: 'chicken' },
  'fried chicken': { tags: ['fried', 'chicken', 'protein'], calorieLevel: 'high', protein: 'chicken' },

  // Vegetables
  'gado-gado': { tags: ['vegetable', 'tofu', 'protein'], calorieLevel: 'medium', protein: 'tofu' },
  'sayur asem': { tags: ['vegetable', 'healthy'], calorieLevel: 'low' },
  'capcay': { tags: ['vegetable'], calorieLevel: 'low' },
  'kangkung': { tags: ['vegetable', 'healthy'], calorieLevel: 'low' },
  'bayam': { tags: ['vegetable', 'healthy'], calorieLevel: 'low' },
  'salad': { tags: ['vegetable', 'healthy'], calorieLevel: 'low' },

  // Soups
  'soto ayam': { tags: ['soup', 'chicken', 'protein'], calorieLevel: 'medium', protein: 'chicken' },
  'soto betawi': { tags: ['soup', 'beef', 'protein'], calorieLevel: 'high', protein: 'beef' },
  'rawon': { tags: ['soup', 'beef', 'protein'], calorieLevel: 'medium', protein: 'beef' },
  'bakso': { tags: ['soup', 'beef', 'protein'], calorieLevel: 'medium', protein: 'beef' },

  // Fish
  'ikan goreng': { tags: ['fried', 'fish', 'protein'], calorieLevel: 'high', protein: 'fish' },
  'ikan bakar': { tags: ['fish', 'protein', 'healthy'], calorieLevel: 'medium', protein: 'fish' },
  'tuna': { tags: ['fish', 'protein'], calorieLevel: 'medium', protein: 'fish' },
  'salmon': { tags: ['fish', 'protein', 'healthy'], calorieLevel: 'medium', protein: 'fish' },

  // Seafood
  'udang goreng': { tags: ['fried', 'seafood', 'protein'], calorieLevel: 'high', protein: 'seafood' },
  'cumi-cumi': { tags: ['seafood', 'protein'], calorieLevel: 'medium', protein: 'seafood' },

  // Egg
  'telur ceplok': { tags: ['egg', 'protein'], calorieLevel: 'medium', protein: 'egg' },
  'telur goreng': { tags: ['fried', 'egg', 'protein'], calorieLevel: 'high', protein: 'egg' },
  'omelette': { tags: ['egg', 'protein'], calorieLevel: 'medium', protein: 'egg' },

  // Beef
  'rendang': { tags: ['beef', 'protein'], calorieLevel: 'high', protein: 'beef' },
  'daging goreng': { tags: ['fried', 'beef', 'protein'], calorieLevel: 'high', protein: 'beef' },
  'steak': { tags: ['beef', 'protein'], calorieLevel: 'high', protein: 'beef' },

  // Tofu/Tempeh
  'tahu goreng': { tags: ['fried', 'tofu', 'vegetarian', 'protein'], calorieLevel: 'medium', protein: 'tofu' },
  'tempeh goreng': { tags: ['fried', 'tempeh', 'vegetarian', 'protein'], calorieLevel: 'medium', protein: 'tempeh' },
  'tahu': { tags: ['tofu', 'vegetarian', 'protein'], calorieLevel: 'low', protein: 'tofu' },

  // Noodles & Rice
  'nasi goreng': { tags: ['fried', 'rice'], calorieLevel: 'high' },
  'mie goreng': { tags: ['fried', 'noodle'], calorieLevel: 'high' },
  'mi rebus': { tags: ['noodle'], calorieLevel: 'medium' },
  'nasi kuning': { tags: ['rice'], calorieLevel: 'medium' },
  'nasi putih': { tags: ['rice'], calorieLevel: 'medium' },
  'bubur': { tags: ['rice', 'light'], calorieLevel: 'low' },

  // Fast Food
  'burger': { tags: ['fast-food'], calorieLevel: 'high' },
  'pizza': { tags: ['fast-food'], calorieLevel: 'high' },
  'fried rice': { tags: ['fried', 'rice'], calorieLevel: 'high' },
  'karaage': { tags: ['fried', 'chicken', 'protein'], calorieLevel: 'high', protein: 'chicken' },

  // Drinks - Sugary
  'teh manis': { tags: ['sugary-drink', 'tea'], calorieLevel: 'high' },
  'teh pucuk': { tags: ['sugary-drink', 'tea'], calorieLevel: 'medium' },
  'boba': { tags: ['sugary-drink'], calorieLevel: 'high' },
  'bubble tea': { tags: ['sugary-drink'], calorieLevel: 'high' },
  'iced tea': { tags: ['sugary-drink', 'tea'], calorieLevel: 'medium' },
  'soda': { tags: ['sugary-drink'], calorieLevel: 'high' },
  'cola': { tags: ['sugary-drink'], calorieLevel: 'high' },
  'orange juice': { tags: ['juice'], calorieLevel: 'medium' },
  'smoothie': { tags: ['juice'], calorieLevel: 'medium' },

  // Drinks - Healthy
  'air putih': { tags: ['healthy'], calorieLevel: 'low' },
  'kopi': { tags: ['coffee'], calorieLevel: 'low' },
  'teh': { tags: ['tea'], calorieLevel: 'low' },
  'coffee': { tags: ['coffee'], calorieLevel: 'low' },

  // Snacks & Desserts
  'kue': { tags: ['sweet', 'snack'], calorieLevel: 'high' },
  'cake': { tags: ['sweet', 'snack'], calorieLevel: 'high' },
  'donut': { tags: ['fried', 'sweet', 'snack'], calorieLevel: 'high' },
  'ice cream': { tags: ['sweet', 'snack'], calorieLevel: 'high' },
  'chocolate': { tags: ['sweet', 'snack'], calorieLevel: 'high' },
  'chips': { tags: ['snack'], calorieLevel: 'high' },
  'popcorn': { tags: ['snack'], calorieLevel: 'medium' },
  'nuts': { tags: ['snack', 'healthy'], calorieLevel: 'medium' },

  // Breakfast
  'roti bakar': { tags: ['breakfast'], calorieLevel: 'medium' },
  'sandwich': { tags: ['breakfast'], calorieLevel: 'medium' },
  'omelet': { tags: ['egg', 'protein', 'breakfast'], calorieLevel: 'medium', protein: 'egg' },
  'toast': { tags: ['breakfast'], calorieLevel: 'low' },
}

export function autoTagMeal(foodName: string): HealthAttributes {
  const lowerFood = foodName.toLowerCase().trim()

  // Exact match
  if (MEAL_HEALTH_MAP[lowerFood]) {
    return MEAL_HEALTH_MAP[lowerFood]
  }

  // Partial match (contains key)
  for (const [key, attrs] of Object.entries(MEAL_HEALTH_MAP)) {
    if (lowerFood.includes(key)) {
      return attrs
    }
  }

  // Keyword-based fallback
  const tags: string[] = []
  let calorieLevel: CalorieLevel = 'medium'
  let protein: ProteinType | undefined

  if (/\b(goreng|fried|geprek|lele|karaage)\b/i.test(foodName)) {
    tags.push('fried')
    calorieLevel = 'high'
  }

  if (/\b(sayur|vegetable|salad|gado|capcay|kangkung|bayam|cai|sawi)\b/i.test(foodName)) {
    tags.push('vegetable')
    if (!tags.includes('fried')) calorieLevel = 'low'
  }

  if (/\b(ayam|chicken)\b/i.test(foodName)) {
    tags.push('chicken')
    protein = 'chicken'
  }

  if (/\b(ikan|fish|lele|nila|salmon|tuna)\b/i.test(foodName)) {
    tags.push('fish')
    protein = 'fish'
  }

  if (/\b(udang|shrimp|seafood)\b/i.test(foodName)) {
    tags.push('seafood')
    protein = 'seafood'
  }

  if (/\b(daging|beef|sapi)\b/i.test(foodName)) {
    tags.push('beef')
    protein = 'beef'
    calorieLevel = 'high'
  }

  if (/\b(telur|egg)\b/i.test(foodName)) {
    tags.push('egg')
    protein = 'egg'
  }

  if (/\b(tahu|tofu)\b/i.test(foodName)) {
    tags.push('tofu')
    protein = 'tofu'
  }

  if (/\b(tempeh)\b/i.test(foodName)) {
    tags.push('tempeh')
    protein = 'tempeh'
  }

  if (/\b(teh manis|boba|bubble|soda|cola|sweet drink)\b/i.test(foodName)) {
    tags.push('sugary-drink')
    calorieLevel = 'high'
  }

  if (/\b(kopi|coffee|teh|tea)\b/i.test(foodName)) {
    tags.push('coffee')
  }

  if (/\b(nasi|rice)\b/i.test(foodName)) {
    tags.push('rice')
  }

  if (/\b(mie|noodle)\b/i.test(foodName)) {
    tags.push('noodle')
  }

  if (/\b(pedas|spicy|sambal|mercon|level)\b/i.test(foodName)) {
    tags.push('spicy')
  }

  if (/\b(sehat|healthy|light|ringan|diet)\b/i.test(foodName)) {
    tags.push('healthy')
    if (calorieLevel === 'medium') calorieLevel = 'low'
  }

  if (/\b(soup|soto|bakso|rawon|betawi)\b/i.test(foodName)) {
    tags.push('soup')
  }

  if (tags.length === 0) {
    tags.push('other')
  }

  return {
    tags: Array.from(new Set(tags)),
    calorieLevel,
    protein
  }
}

export function getMealHealthTags(foodName: string): string[] {
  return autoTagMeal(foodName).tags
}

export function getMealCalorieLevel(foodName: string): CalorieLevel {
  return autoTagMeal(foodName).calorieLevel
}
