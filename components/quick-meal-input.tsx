'use client'

import { useState, useRef, useEffect } from 'react'
import { parseQuickMeal, getToday, MEAL_TYPE_LABELS, SOURCE_LABELS } from '@/lib/meal-storage'
import { saveMealToDb } from '@/lib/meal-database'
import type { Meal, MealType, MealSource } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles } from 'lucide-react'

interface QuickMealInputProps {
  defaultMealType?: MealType
  defaultDate?: string
  onMealAdded?: (meal: Meal) => void
  onOpenFullForm?: (parsedData: Partial<Meal>) => void
}

const EXAMPLES = [
  'Dinner ayam bakar takeout 95k enak',
  'Lunch nasi goreng rumah',
  'Sarapan roti delivery grab 35k',
  'Makan malam ayam bakar gofood 95rb enak',
  'Malam sayur asem rumah 30rb sehat',
  'Makan siang sate makan di resto 80k mantap',
]

export function QuickMealInput({ defaultMealType, defaultDate, onMealAdded, onOpenFullForm }: QuickMealInputProps) {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<Partial<Meal> | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (input.trim()) {
      const parsed = parseQuickMeal(input)
      if (!parsed.mealType && defaultMealType) {
        parsed.mealType = defaultMealType
      }
      setPreview(parsed)
    } else {
      setPreview(null)
    }
  }, [input, defaultMealType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!preview?.food) {
      inputRef.current?.focus()
      return
    }

    // Check if we have enough info for quick save
    if (preview.mealType && preview.food) {
      const savedMeal = await saveMealToDb({
        date: defaultDate || getToday(),
        mealType: preview.mealType,
        food: preview.food,
        source: preview.source || 'home',
        vendor: preview.vendor,
        cost: preview.cost,
        rating: preview.rating,
        notes: preview.notes,
        tags: preview.tags,
      })
      
      if (savedMeal) {
        onMealAdded?.(savedMeal)
        setInput('')
        setPreview(null)
      }
    } else {
      // Open full form with parsed data
      onOpenFullForm?.(preview)
    }
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
    setShowExamples(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setShowExamples(true)}
              onBlur={() => setTimeout(() => setShowExamples(false), 200)}
              placeholder="Contoh: Dinner ayam bakar takeout 95k enak..."
              className="pr-10 h-12 text-base bg-card"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setShowExamples(!showExamples)}
            >
              <Sparkles className="h-4 w-4" />
              <span className="sr-only">Show examples</span>
            </Button>
          </div>
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
            <Send className="h-5 w-5" />
            <span className="sr-only">Submit</span>
          </Button>
        </div>
      </form>

      {/* Preview of parsed meal */}
      {preview && Object.keys(preview).length > 0 && (
        <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
            Preview
          </p>
          <div className="flex flex-wrap gap-2">
            {preview.food && (
              <span className="px-2 py-1 rounded-md bg-card text-foreground font-medium">
                {preview.food}
              </span>
            )}
            {preview.mealType && (
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary">
                {MEAL_TYPE_LABELS[preview.mealType]}
              </span>
            )}
            {preview.source && (
              <span className="px-2 py-1 rounded-md bg-accent/20 text-accent-foreground">
                {SOURCE_LABELS[preview.source]}
              </span>
            )}
            {preview.cost && (
              <span className="px-2 py-1 rounded-md bg-success/20 text-success-foreground font-medium">
                Rp {preview.cost.toLocaleString('id-ID')}
              </span>
            )}
            {preview.rating && (
              <span className="px-2 py-1 rounded-md bg-warning/20 text-warning-foreground">
                {'⭐'.repeat(preview.rating)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Examples dropdown */}
      {showExamples && !preview && (
        <div className="p-3 rounded-lg bg-card border shadow-lg space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Contoh format
          </p>
          <div className="space-y-1">
            {EXAMPLES.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
