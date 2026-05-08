'use client'

import { useState } from 'react'
import type { Meal, MealType } from '@/lib/types'
import { 
  formatCurrency, 
  MEAL_TYPE_LABELS, 
  MEAL_TYPE_ICONS, 
  SOURCE_LABELS, 
  SOURCE_ICONS
} from '@/lib/meal-storage'
import { deleteMealFromDb } from '@/lib/meal-database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Trash2, Edit2 } from 'lucide-react'

interface MealCardProps {
  meal: Meal
  onEdit?: (meal: Meal) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export function MealCard({ meal, onEdit, onDelete, compact = false }: MealCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm('Hapus makanan ini?')) {
      setIsDeleting(true)
      const ok = await deleteMealFromDb(meal.id)
      if (ok) onDelete?.(meal.id)
      else setIsDeleting(false)
    }
  }

  return (
    <Card className={`overflow-hidden transition-all ${isDeleting ? 'opacity-50 scale-95' : ''}`}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{MEAL_TYPE_ICONS[meal.mealType]}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {MEAL_TYPE_LABELS[meal.mealType]}
              </span>
            </div>
            
            <h3 className={`font-semibold text-foreground truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {meal.food}
            </h3>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {SOURCE_ICONS[meal.source]} {SOURCE_LABELS[meal.source]}
              </span>
              
              {meal.vendor && (
                <span className="inline-flex items-center gap-1">
                  • {meal.vendor}
                </span>
              )}
            </div>

            {meal.tags && meal.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {meal.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {meal.notes && !compact && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {meal.notes}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            {meal.cost && meal.cost > 0 && (
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(meal.cost)}
              </span>
            )}
            
            {meal.rating && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < meal.rating! 
                        ? 'fill-warning text-warning' 
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {!compact && (
              <div className="flex gap-1 mt-1">
                {onEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onEdit(meal)}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EmptyMealSlotProps {
  mealType: MealType
  onAdd: (mealType: MealType) => void
}

export function EmptyMealSlot({ mealType, onAdd }: EmptyMealSlotProps) {
  return (
    <button
      onClick={() => onAdd(mealType)}
      className="w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl opacity-40 group-hover:opacity-70 transition-opacity">
          {MEAL_TYPE_ICONS[mealType]}
        </span>
        <div className="text-left">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {MEAL_TYPE_LABELS[mealType]}
          </p>
          <p className="text-xs text-muted-foreground/60">
            Tap untuk tambah
          </p>
        </div>
      </div>
    </button>
  )
}
