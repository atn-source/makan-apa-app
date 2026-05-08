'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Meal, MealType } from '@/lib/types'
import { getMealsForDate, getToday, formatDate, duplicateMealForDate, getLastMealForType, formatCurrency } from '@/lib/meal-storage'
import { MealCard, EmptyMealSlot } from '@/components/meal-card'
import { QuickMealInput } from '@/components/quick-meal-input'
import { MealForm } from '@/components/meal-form'
import { ChevronLeft, ChevronRight, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [meals, setMeals] = useState<Meal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [initialFormData, setInitialFormData] = useState<Partial<Meal>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const loadMeals = useCallback(() => {
    const dayMeals = getMealsForDate(selectedDate)
    setMeals(dayMeals)
  }, [selectedDate])

  useEffect(() => {
    loadMeals()
  }, [loadMeals, refreshKey])

  const handlePrevDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    const today = new Date()
    if (date <= today) {
      setSelectedDate(date.toISOString().split('T')[0])
    }
  }

  const handleAddMeal = (mealType: MealType) => {
    setInitialFormData({ mealType, date: selectedDate })
    setEditingMeal(null)
    setShowForm(true)
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setInitialFormData({})
    setShowForm(true)
  }

  const handleMealAdded = () => {
    setRefreshKey(k => k + 1)
  }

  const handleFormSave = () => {
    setShowForm(false)
    setEditingMeal(null)
    setInitialFormData({})
    setRefreshKey(k => k + 1)
  }

  const handleOpenFullForm = (parsedData: Partial<Meal>) => {
    setInitialFormData({ ...parsedData, date: selectedDate })
    setEditingMeal(null)
    setShowForm(true)
  }


  const handleRepeatLastMeal = (mealType?: MealType) => {
    const lastMeal = getLastMealForType(mealType)
    if (!lastMeal) return
    duplicateMealForDate(lastMeal, selectedDate, mealType || lastMeal.mealType)
    setRefreshKey(k => k + 1)
  }

  const isToday = selectedDate === getToday()
  const mealsByType = MEAL_ORDER.map(type => ({
    type,
    meals: meals.filter(m => m.mealType === type)
  }))

  const totalSpent = meals.reduce((sum, m) => sum + (m.cost || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-foreground">Makan Apa?</h1>
          {totalSpent > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total hari ini</p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          )}
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous day</span>
          </Button>
          
          <div className="text-center">
            <p className="text-sm font-medium">
              {isToday ? 'Hari Ini' : formatDate(selectedDate)}
            </p>
            {isToday && (
              <p className="text-xs text-muted-foreground">
                {formatDate(selectedDate)}
              </p>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextDay}
            disabled={isToday}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Quick Input */}
        <section>
          <p className="text-sm text-muted-foreground mb-2">Tambah cepat</p>
          <QuickMealInput 
            defaultDate={selectedDate}
            onMealAdded={handleMealAdded}
            onOpenFullForm={handleOpenFullForm}
          />

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => handleRepeatLastMeal('dinner')}>
              <Repeat2 className="h-4 w-4 mr-2" /> Repeat dinner
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRepeatLastMeal()}>
              <Repeat2 className="h-4 w-4 mr-2" /> Repeat last
            </Button>
          </div>
        </section>

        {/* Meals by Type */}
        <section className="space-y-4">
          {mealsByType.map(({ type, meals: typeMeals }) => (
            <div key={type}>
              {typeMeals.length > 0 ? (
                <div className="space-y-2">
                  {typeMeals.map(meal => (
                    <MealCard 
                      key={meal.id} 
                      meal={meal}
                      onEdit={handleEditMeal}
                      onDelete={handleMealAdded}
                    />
                  ))}
                </div>
              ) : (
                <EmptyMealSlot mealType={type} onAdd={handleAddMeal} />
              )}
            </div>
          ))}
        </section>
      </div>

      {/* Meal Form Modal */}
      {showForm && (
        <MealForm
          initialData={initialFormData}
          editMeal={editingMeal || undefined}
          onSave={handleFormSave}
          onCancel={() => {
            setShowForm(false)
            setEditingMeal(null)
            setInitialFormData({})
          }}
        />
      )}
    </div>
  )
}
