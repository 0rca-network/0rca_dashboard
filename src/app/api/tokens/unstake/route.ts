import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const supabase = createClient()

    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    let currentBalance = balanceData
    if (balanceError || !balanceData) {
      // Create balance if not exists
      const { data: insertData, error: insertError } = await supabase
        .from('token_balances')
        .insert({ user_id: userId, balance: 100, voting_power: 100 })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create balance' }, { status: 500 })
      }
      currentBalance = insertData
    }

    if (balanceData.staked_balance < parsedAmount) {
      return NextResponse.json({ error: 'Insufficient staked balance' }, { status: 400 })
    }

    // Create unstaking request
    const availableAt = new Date()
    availableAt.setDate(availableAt.getDate() + 7) // 7-day unstaking period

    const { data: unstakingRequest, error: unstakingError } = await supabase
      .from('unstaking_requests')
      .insert({
        user_id: userId,
        amount: parsedAmount,
        available_at: availableAt.toISOString(),
        status: 'PENDING'
      })
      .select()
      .single()

    if (unstakingError) {
      return NextResponse.json({ error: 'Failed to create unstaking request' }, { status: 500 })
    }

    return NextResponse.json({
      unstakingRequest,
      success: true
    })
  } catch (error) {
    console.error('Error requesting unstake:', error)
    return NextResponse.json({ error: 'Failed to request unstake' }, { status: 500 })
  }
}