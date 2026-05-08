'use client'

import { useState, useEffect } from 'react'
import type { Meal, MealType, MealSource } from '@/lib/types'
import { 
  getToday, 
  MEAL_TYPE_LABELS, 
  MEAL_TYPE_ICONS,
  SOURCE_LABELS,
  SOURCE_ICONS
} from '@/lib/meal-storage'
import { saveMealToDb, updateMealInDb } from '@/lib/meal-database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Star, Check } from 'lucide-react'

interface MealFormProps {
  initialData?: Partial<Meal>
  editMeal?: Meal
  onSave?: (meal: Meal) => void
  onCancel?: () => void
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const SOURCES: MealSource[] = ['home', 'takeout', 'dine-out', 'delivery']
const COMMON_TAGS = ['fried', 'vegetable', 'spicy', 'sweet', 'healthy', 'comfort']

export function MealForm({ initialData, editMeal, onSave, onCancel }: MealFormProps) {
  const [formData, setFormData] = useState<Partial<Meal>>({
    date: getToday(),
    mealType: 'lunch',
    food: '',
    source: 'home',
    vendor: '',
    cost: undefined,
    rating: undefined,
    notes: '',
    tags: [],
    ...initialData,
    ...editMeal,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.food?.trim()) {
      newErrors.food = 'Nama makanan wajib diisi'
    }
    if (!formData.mealType) {
      newErrors.mealType = 'Pilih waktu makan'
    }
    if (!formData.date) {
      newErrors.date = 'Pilih tanggal'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const mealData = {
      date: formData.date!,
      mealType: formData.mealType!,
      food: formData.food!.trim(),
      source: formData.source || 'home',
      vendor: formData.vendor?.trim() || undefined,
      cost: formData.cost || undefined,
      rating: formData.rating || undefined,
      notes: formData.notes?.trim() || undefined,
      tags: formData.tags?.length ? formData.tags : undefined,
    }
    
    const savedMeal = editMeal
      ? await updateMealInDb(editMeal.id, mealData)
      : await saveMealToDb(mealData)

    if (savedMeal) onSave?.(savedMeal)
  }

  const toggleTag = (tag: string) => {
    const currentTags = formData.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    setFormData({ ...formData, tags: newTags })
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto bg-background rounded-t-2xl shadow-xl border-t animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-background z-10 px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editMeal ? 'Edit Makanan' : 'Tambah Makanan'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={errors.date ? 'border-destructive' : ''}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label>Waktu Makan</Label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, mealType: type })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    formData.mealType === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl block mb-1">{MEAL_TYPE_ICONS[type]}</span>
                  <span className="text-xs font-medium">{MEAL_TYPE_LABELS[type]}</span>
                </button>
              ))}
            </div>
            {errors.mealType && <p className="text-xs text-destructive">{errors.mealType}</p>}
          </div>

          {/* Food Name */}
          <div className="space-y-2">
            <Label htmlFor="food">Nama Makanan *</Label>
            <Input
              id="food"
              value={formData.food}
              onChange={(e) => setFormData({ ...formData, food: e.target.value })}
              placeholder="Contoh: Nasi Goreng Ayam"
              className={errors.food ? 'border-destructive' : ''}
            />
            {errors.food && <p className="text-xs text-destructive">{errors.food}</p>}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label>Sumber</Label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map(source => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setFormData({ ...formData, source })}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    formData.source === source
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">{SOURCE_ICONS[source]}</span>
                  <span className="text-sm font-medium">{SOURCE_LABELS[source]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vendor */}
          {formData.source !== 'home' && (
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor / Tempat</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Contoh: Warung Pak Joko"
              />
            </div>
          )}

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Harga (Rp)</Label>
            <Input
              id="cost"
              type="number"
              value={formData.cost || ''}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Contoh: 35000"
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: formData.rating === star ? undefined : star })}
                  className="p-2"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      formData.rating && star <= formData.rating
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/30 hover:text-warning/50'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    formData.tags?.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {tag}
                  {formData.tags?.includes(tag) && (
                    <Check className="inline-block ml-1 h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {editMeal ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
