'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore, SelectedOption } from '@/store/useCartStore'
import { supabase } from '@/lib/supabase'
import { Plus, Minus, X, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface MenuOptionChoice {
  name: string
  price: number
}

interface MenuOption {
  id: number
  name: string
  choices: MenuOptionChoice[]
  is_required: boolean
  max_selection: number
  sort_order: number
}

interface MenuItem {
  id: number
  name: string
  price: number
  image_url?: string
  description?: string
}

interface MenuOptionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menu: MenuItem | null
}

export function MenuOptionDrawer({ open, onOpenChange, menu }: MenuOptionDrawerProps) {
  const [options, setOptions] = useState<MenuOption[]>([])
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [selections, setSelections] = useState<Record<number, string[]>>({})
  const addToCart = useCartStore((state) => state.addToCart)

  useEffect(() => {
    if (menu && open) {
      setQuantity(1)
      setNote('')
      setSelections({})
      fetchOptions(menu.id)
    }
  }, [menu, open])

  const fetchOptions = async (menuId: number) => {
    setLoading(true)
    const { data } = await supabase
      .from('menu_options')
      .select('*')
      .eq('menu_id', menuId)
      .order('sort_order')

    if (data) {
      const parsed = data.map((opt: any) => ({
        ...opt,
        choices: typeof opt.choices === 'string' ? JSON.parse(opt.choices) : opt.choices
      }))
      setOptions(parsed)
      // Pre-select first choice for required single-select options
      const initial: Record<number, string[]> = {}
      parsed.forEach((opt: MenuOption) => {
        if (opt.is_required && opt.max_selection === 1 && opt.choices.length > 0) {
          initial[opt.id] = [opt.choices[0].name]
        }
      })
      setSelections(initial)
    } else {
      setOptions([])
    }
    setLoading(false)
  }

  const toggleChoice = (optionId: number, choiceName: string, maxSelection: number) => {
    setSelections(prev => {
      const current = prev[optionId] || []
      if (maxSelection === 1) {
        // Radio behavior
        return { ...prev, [optionId]: [choiceName] }
      }
      // Checkbox behavior
      if (current.includes(choiceName)) {
        return { ...prev, [optionId]: current.filter(c => c !== choiceName) }
      }
      if (current.length >= maxSelection) {
        return prev
      }
      return { ...prev, [optionId]: [...current, choiceName] }
    })
  }

  const isSelected = (optionId: number, choiceName: string) => {
    return (selections[optionId] || []).includes(choiceName)
  }

  const canSubmit = () => {
    return options
      .filter(o => o.is_required)
      .every(o => (selections[o.id] || []).length > 0)
  }

  const calculateAddonsPrice = (): number => {
    let total = 0
    options.forEach(opt => {
      const selected = selections[opt.id] || []
      opt.choices.forEach(choice => {
        if (selected.includes(choice.name)) {
          total += choice.price || 0
        }
      })
    })
    return total
  }

  const handleAddToCart = () => {
    if (!menu || !canSubmit()) return

    const selectedOptions: SelectedOption[] = options
      .filter(opt => (selections[opt.id] || []).length > 0)
      .map(opt => {
        const selected = selections[opt.id] || []
        const extraPrice = opt.choices
          .filter(c => selected.includes(c.name))
          .reduce((sum, c) => sum + (c.price || 0), 0)
        return {
          optionName: opt.name,
          choices: selected,
          extraPrice
        }
      })

    const addonsPrice = calculateAddonsPrice()

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: menu.id,
        name: menu.name,
        price: menu.price,
        selectedOptions,
        note,
        addonsPrice
      })
    }

    // Close after slight delay for feedback
    onOpenChange(false)
  }

  if (!menu) return null

  const addonsPrice = calculateAddonsPrice()
  const unitPrice = menu.price + addonsPrice
  const totalPrice = unitPrice * quantity

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] flex flex-col p-0">
        {/* Header */}
        <div className="relative">
          {menu.image_url ? (
            <div className="h-48 overflow-hidden rounded-t-3xl">
              <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-[#e0f2fe] to-[#f5f5f4] rounded-t-3xl" />
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <h2 className="text-xl font-bold text-gray-900">{menu.name}</h2>
          {menu.description && (
            <p className="text-sm text-gray-500 mt-1">{menu.description}</p>
          )}
          <p className="text-[#0ea5e9] font-bold text-lg mt-1">฿{menu.price}</p>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0ea5e9] mx-auto" />
            </div>
          ) : (
            <div className="space-y-5">
              {options.map((option) => (
                <div key={option.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900">{option.name}</h3>
                    {option.is_required ? (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Required</span>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                    )}
                  </div>
                  {option.max_selection > 1 && (
                    <p className="text-[10px] text-gray-400 mb-2">Select up to {option.max_selection}</p>
                  )}
                  <div className="space-y-1.5">
                    {option.choices.map((choice) => {
                      const selected = isSelected(option.id, choice.name)
                      return (
                        <button
                          key={choice.name}
                          onClick={() => toggleChoice(option.id, choice.name, option.max_selection)}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-[#0ea5e9] bg-[#e0f2fe]/50'
                              : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected ? 'border-[#0ea5e9] bg-[#0ea5e9]' : 'border-gray-300'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm ${selected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {choice.name}
                            </span>
                          </div>
                          {choice.price > 0 && (
                            <span className="text-sm text-[#f97316] font-medium">+฿{choice.price}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Special Instructions</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., No MSG, less spicy, no green onion..."
                  rows={2}
                  className="w-full px-3.5 py-3 bg-[#f5f5f4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {/* Quantity */}
          <div className="flex items-center justify-center space-x-5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full bg-[#f5f5f4] flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-2xl font-bold text-gray-900 min-w-[40px] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full bg-[#f5f5f4] flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={!canSubmit()}
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-[#0ea5e9]/20 transition-all flex items-center justify-between px-6"
          >
            <span>Add to Cart</span>
            <span>฿{totalPrice.toLocaleString()}</span>
          </motion.button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
