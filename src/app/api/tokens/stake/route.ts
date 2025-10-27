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

    if (balanceData.balance < parsedAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Update local balance
    const newBalance = balanceData.balance - parsedAmount
    const newStakedBalance = balanceData.staked_balance + parsedAmount
    const newVotingPower = newBalance + newStakedBalance * 1.5

    const { error: updateError } = await supabase
      .from('token_balances')
      .update({
        balance: newBalance,
        staked_balance: newStakedBalance,
        voting_power: newVotingPower,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      newBalance,
      newStakedBalance,
      newVotingPower
    })
  } catch (error) {
    console.error('Error staking tokens:', error)
    return NextResponse.json({ error: 'Failed to stake tokens' }, { status: 500 })
  }
}