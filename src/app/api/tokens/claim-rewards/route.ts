import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createClient()

    // Calculate and apply rewards (simplified for now)
    const rewardAmount = 0 // TODO: Implement rewards calculation

    // Create reward claim record
    const { data: claimRecord, error: claimError } = await supabase
      .from('dao_treasury')
      .insert({
        transaction_type: 'DISTRIBUTION',
        amount: rewardAmount,
        recipient_id: userId,
        description: 'Staking rewards claim',
        status: 'EXECUTED'
      })
      .select()
      .single()

    if (claimError) {
      return NextResponse.json({ error: 'Failed to create claim record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      rewardAmount,
      claimRecord
    })
  } catch (error) {
    console.error('Error claiming rewards:', error)
    return NextResponse.json({ error: 'Failed to claim rewards' }, { status: 500 })
  }
}