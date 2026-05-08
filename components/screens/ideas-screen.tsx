'use client'

import { useState, useEffect } from 'react'
import type { MealRecommendation } from '@/lib/types'
import { getRecommendations, formatCurrency, SOURCE_ICONS } from '@/lib/meal-storage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Star, Clock, TrendingUp, Lightbulb, RefreshCw, Filter, Shuffle, Sparkles } from 'lucide-react'

export function IdeasScreen() {
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [budgetRange, setBudgetRange] = useState([0])
  const [loading, setLoading] = useState(true)
  
  // Random generator state
  const [randomFood, setRandomFood] = useState<MealRecommendation | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinningText, setSpinningText] = useState('')

  const loadRecommendations = () => {
    setLoading(true)
    const budget = budgetRange[0] > 0 ? budgetRange[0] * 1000 : undefined
    const recs = getRecommendations(budget)
    setRecommendations(recs)
    setLoading(false)
  }

  useEffect(() => {
    loadRecommendations()
  }, [budgetRange])

  const spinRandomFood = () => {
    if (recommendations.length === 0) return
    
    setIsSpinning(true)
    setRandomFood(null)
    
    // Spinning animation - cycle through foods quickly
    let spinCount = 0
    const maxSpins = 20
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * recommendations.length)
      setSpinningText(recommendations[randomIndex].food)
      spinCount++
      
      if (spinCount >= maxSpins) {
        clearInterval(spinInterval)
        // Final selection
        const finalIndex = Math.floor(Math.random() * recommendations.length)
        const selected = recommendations[finalIndex]
        setRandomFood(selected)
        setSpinningText('')
        setIsSpinning(false)
      }
    }, 80)
  }

  const getDaysSinceEaten = (lastEaten: string) => {
    const today = new Date()
    const lastDate = new Date(lastEaten)
    const days = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Hari ini'
    if (days === 1) return 'Kemarin'
    if (days < 7) return `${days} hari lalu`
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`
    return `${Math.floor(days / 30)} bulan lalu`
  }

  const getScoreColor = (score: number) => {
    if (score >= 6) return 'text-success bg-success/10'
    if (score >= 4) return 'text-primary bg-primary/10'
    return 'text-muted-foreground bg-muted'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-warning" />
            <h1 className="text-2xl font-bold text-foreground">Ideas</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
            <Button variant="outline" size="icon" onClick={loadRecommendations}>
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Rekomendasi berdasarkan riwayat makanmu
        </p>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-4 border-b bg-secondary/30">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Budget Maksimal</span>
                <span className="text-sm font-medium text-primary">
                  {budgetRange[0] > 0 ? formatCurrency(budgetRange[0] * 1000) : 'Tidak ada batas'}
                </span>
              </Label>
              <Slider
                value={budgetRange}
                onValueChange={setBudgetRange}
                max={200}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Geser ke 0 untuk tidak ada batas budget
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Random Food Generator */}
      <div className="px-4 pt-4">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shuffle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Random Food Generator</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Bingung mau makan apa? Biar sistem yang pilih!
            </p>
            
            {/* Spinning Display */}
            <div className="min-h-[80px] flex items-center justify-center mb-4">
              {isSpinning ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary animate-pulse">
                    {spinningText}
                  </div>
                  <Sparkles className="h-5 w-5 mx-auto mt-2 text-warning animate-spin" />
                </div>
              ) : randomFood ? (
                <div className="w-full bg-card rounded-lg p-4 border border-primary/30 shadow-sm">
                  <div className="text-center">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">Hasil Pilihan</span>
                    <h3 className="text-xl font-bold text-foreground mt-1">{randomFood.food}</h3>
                    <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
                      {randomFood.avgCost > 0 && (
                        <span className="text-primary font-medium">
                          ~{formatCurrency(randomFood.avgCost)}
                        </span>
                      )}
                      {randomFood.avgRating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          {randomFood.avgRating}
                        </span>
                      )}
                      <span>{randomFood.timesEaten}x dimakan</span>
                    </div>
                    {randomFood.vendors.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          dari {randomFood.vendors.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Shuffle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tekan tombol untuk pilih makanan acak</p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={spinRandomFood} 
              disabled={isSpinning || recommendations.length === 0}
              className="w-full"
              size="lg"
            >
              {isSpinning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memilih...
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4 mr-2" />
                  {randomFood ? 'Acak Lagi' : 'Acak Makanan'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Divider */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Semua Rekomendasi
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Belum ada rekomendasi</h3>
            <p className="text-sm text-muted-foreground">
              Mulai catat makananmu di tab Today untuk mendapatkan rekomendasi
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 15).map((rec, index) => (
              <Card key={rec.food} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(rec.score)}`}>
                          #{index + 1}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-foreground text-lg">
                        {rec.food}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {getDaysSinceEaten(rec.lastEaten)}
                        </span>
                        
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {rec.timesEaten}x
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {rec.sources.map(source => (
                          <span 
                            key={source}
                            className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                          >
                            {SOURCE_ICONS[source]}
                          </span>
                        ))}
                        {rec.vendors.slice(0, 2).map(vendor => (
                          <span 
                            key={vendor}
                            className="text-xs px-2 py-1 rounded-md bg-accent/20 text-accent-foreground"
                          >
                            {vendor}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {rec.avgCost > 0 && (
                        <span className="text-sm font-semibold text-primary">
                          ~{formatCurrency(rec.avgCost)}
                        </span>
                      )}
                      
                      {rec.avgRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm font-medium">{rec.avgRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
