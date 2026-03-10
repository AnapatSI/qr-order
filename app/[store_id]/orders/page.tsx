'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Clock, ChefHat, CheckCircle, CreditCard, ArrowLeft, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface OrderItem {
  quantity: number
  selected_options?: string
  note?: string
  menus: { name: string }
}

interface Order {
  id: number
  status: string
  total_price: number
  created_at: string
  order_items: OrderItem[]
}

interface ReviewData {
  rating: number
  comment: string
  customerName: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Waiting', color: '#f97316', bg: '#fff7ed', icon: Clock },
  cooking: { label: 'Cooking', color: '#0ea5e9', bg: '#e0f2fe', icon: ChefHat },
  served: { label: 'Served', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  paid: { label: 'Paid', color: '#8b5cf6', bg: '#ede9fe', icon: CreditCard },
}

export default function OrderTrackingPage({ params }: { params: Promise<{ store_id: string }> }) {
  const resolvedParams = React.use(params)
  const storeId = resolvedParams.store_id
  const searchParams = useSearchParams()
  const tableNo = searchParams.get('table')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null)
  const [review, setReview] = useState<ReviewData>({ rating: 5, comment: '', customerName: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewedOrders, setReviewedOrders] = useState<Set<number>>(new Set())

  const fetchOrders = async () => {
    if (!tableNo) return
    const { data } = await supabase
      .from('orders')
      .select(`*, order_items(quantity, selected_options, note, menus(name))`)
      .eq('store_id', storeId)
      .eq('table_no', tableNo)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data)
      // Check which orders already have reviews
      const orderIds = data.map((o: Order) => o.id)
      if (orderIds.length > 0) {
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('order_id')
          .in('order_id', orderIds)
        if (existingReviews) {
          setReviewedOrders(new Set(existingReviews.map((r: any) => r.order_id)))
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [storeId, tableNo])

  useEffect(() => {
    if (!storeId || !tableNo) return
    const sub = supabase
      .channel('order-tracking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, () => fetchOrders())
      .subscribe()
    const interval = setInterval(fetchOrders, 5000)
    return () => { sub.unsubscribe(); clearInterval(interval) }
  }, [storeId, tableNo])

  const handleSubmitReview = async () => {
    if (!reviewOrderId || review.rating < 1) return
    setSubmittingReview(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        store_id: storeId,
        order_id: reviewOrderId,
        rating: review.rating,
        comment: review.comment || null,
        customer_name: review.customerName || null
      })

      if (error) {
        console.error('Review insert error:', error)
        alert('Unable to submit review. Please try again.')
        return
      }

      // Update store average_rating
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('store_id', storeId)
      
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length
        await supabase.from('stores').update({ average_rating: Math.round(avg * 100) / 100 }).eq('id', storeId)
      }

      setReviewedOrders(prev => new Set(prev).add(reviewOrderId))
      setReviewSubmitted(true)
      setTimeout(() => {
        setReviewOrderId(null)
        setReviewSubmitted(false)
        setReview({ rating: 5, comment: '', customerName: '' })
      }, 2000)
    } catch (e) {
      console.error('Review error:', e)
      alert('Unable to submit review. Please try again.')
    }
    setSubmittingReview(false)
  }

  if (!tableNo) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center p-4">
        <p className="text-gray-400 text-sm">No table specified.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 py-3 flex items-center space-x-3">
          <Link href={`/${storeId}/menu?table=${tableNo}`} className="w-9 h-9 bg-[#f5f5f4] rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Order Status</h1>
            <p className="text-xs text-[#0ea5e9] font-medium">Table {tableNo}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9] mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No orders yet</p>
            <Link href={`/${storeId}/menu?table=${tableNo}`} className="text-[#0ea5e9] text-sm font-medium mt-2 inline-block">
              Back to Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = config.icon
              const canReview = order.status === 'paid' && !reviewedOrders.has(order.id)
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm"
                >
                  {/* Status Bar */}
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: config.bg }}>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="w-4 h-4" style={{ color: config.color }} />
                      <span className="text-sm font-bold" style={{ color: config.color }}>{config.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-2">
                    {order.order_items.map((item, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-gray-900">
                            <span className="text-[#0ea5e9] font-bold mr-1">{item.quantity}x</span>
                            {item.menus.name}
                          </span>
                        </div>
                        {item.selected_options && (
                          <p className="text-[10px] text-gray-500 ml-5">{item.selected_options}</p>
                        )}
                        {item.note && (
                          <p className="text-[10px] text-[#f97316] ml-5">Note: {item.note}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Order #{order.id}</span>
                    <span className="font-bold text-gray-900">฿{order.total_price.toLocaleString()}</span>
                  </div>

                  {/* Review Button */}
                  {canReview && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => setReviewOrderId(order.id)}
                        className="w-full bg-[#fef3c7] text-[#d97706] rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center space-x-2 hover:bg-[#fde68a] transition-colors"
                      >
                        <Star className="w-4 h-4" />
                        <span>Rate this order</span>
                      </button>
                    </div>
                  )}
                  {reviewedOrders.has(order.id) && (
                    <div className="px-4 pb-3">
                      <div className="text-center text-xs text-[#10b981] font-medium flex items-center justify-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Review submitted</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewOrderId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => { setReviewOrderId(null); setReviewSubmitted(false) }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {reviewSubmitted ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <CheckCircle className="w-16 h-16 text-[#10b981] mx-auto mb-3" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900">Thank you!</h3>
                  <p className="text-sm text-gray-500">Your feedback helps us improve</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Rate Your Experience</h3>

                  {/* Stars */}
                  <div className="flex justify-center space-x-2 mb-5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReview(r => ({ ...r, rating: star }))}>
                        <Star
                          className={`w-10 h-10 transition-colors ${star <= review.rating ? 'text-[#f59e0b] fill-current' : 'text-gray-200'}`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Name */}
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={review.customerName}
                    onChange={(e) => setReview(r => ({ ...r, customerName: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#f5f5f4] rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30"
                  />

                  {/* Comment */}
                  <textarea
                    placeholder="Tell us about your experience..."
                    value={review.comment}
                    onChange={(e) => setReview(r => ({ ...r, comment: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#f5f5f4] rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 resize-none"
                  />

                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-50 text-white rounded-xl py-3.5 font-semibold text-base shadow-lg shadow-[#0ea5e9]/20 transition-all"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
