import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { order_id, store_id } = await request.json()

    if (!order_id || !store_id) {
      return NextResponse.json(
        { error: 'order_id and store_id are required' },
        { status: 400 }
      )
    }

    console.log('Processing payment:', { order_id, store_id })

    // First, get the order details to verify it exists and get the amount
    const { data: orderData, error: orderFetchError } = await supabase
      .from('orders')
      .select('total_price, status')
      .eq('id', order_id)
      .eq('store_id', store_id)
      .single()

    if (orderFetchError || !orderData) {
      console.error('Order not found:', orderFetchError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (orderData.status === 'paid') {
      console.log('Order already paid:', order_id)
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 400 }
      )
    }

    // Update order status to paid
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', order_id)
      .eq('store_id', store_id)

    if (orderError) {
      console.error('Error updating order status:', orderError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    // Get current store data
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('credit_balance, total_orders, total_revenue')
      .eq('id', store_id)
      .single()

    if (storeError || !storeData) {
      console.error('Error fetching store data:', storeError)
      return NextResponse.json(
        { error: 'Failed to fetch store data' },
        { status: 500 }
      )
    }

    // Calculate new balance (subtract 1 credit per order)
    const currentBalance = storeData.credit_balance || 0
    const newBalance = Math.max(0, currentBalance - 1)

    // Update store: credit_balance, total_orders, total_revenue
    await supabase
      .from('stores')
      .update({
        credit_balance: newBalance,
        total_orders: (storeData as any).total_orders ? (storeData as any).total_orders + 1 : 1,
        total_revenue: (storeData as any).total_revenue ? Number((storeData as any).total_revenue) + orderData.total_price : orderData.total_price
      })
      .eq('id', store_id)

    return NextResponse.json({ 
      success: true, 
      newBalance,
      orderTotal: orderData.total_price 
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
