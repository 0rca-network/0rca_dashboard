import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { delegatorId, delegateId, amount } = await request.json()

    if (!delegatorId || !delegateId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if delegator has enough voting power
    const { data: balanceData, error: balanceError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', delegatorId)
      .single()

    let currentBalance = balanceData
    if (balanceError || !balanceData) {
      // Create balance if not exists
      const { data: insertData, error: insertError } = await supabase
        .from('token_balances')
        .insert({ user_id: delegatorId, balance: 100, voting_power: 100 })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create balance' }, { status: 500 })
      }
      currentBalance = insertData
    }

    if (balanceData.voting_power < parsedAmount) {
      return NextResponse.json({ error: 'Insufficient voting power' }, { status: 400 })
    }

    // Check if delegation already exists
    const { data: existingDelegation, error: delegationError } = await supabase
      .from('token_delegations')
      .select('*')
      .eq('delegator_id', delegatorId)
      .eq('delegate_id', delegateId)
      .single()

    let difference = parsedAmount
    if (existingDelegation) {
      difference = parsedAmount - existingDelegation.amount
      // Update existing delegation
      const { error: updateError } = await supabase
        .from('token_delegations')
        .update({ amount: parsedAmount })
        .eq('id', existingDelegation.id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update delegation' }, { status: 500 })
      }
    } else {
      // Create new delegation
      const { error: createError } = await supabase
        .from('token_delegations')
        .insert({
          delegator_id: delegatorId,
          delegate_id: delegateId,
          amount: parsedAmount
        })

      if (createError) {
        return NextResponse.json({ error: 'Failed to create delegation' }, { status: 500 })
      }
    }

    // Update voting powers
    if (difference !== 0) {
      const { error: updateDelegatorError } = await supabase
        .from('token_balances')
        .update({ voting_power: balanceData.voting_power - difference })
        .eq('user_id', delegatorId)

      if (updateDelegatorError) {
        return NextResponse.json({ error: 'Failed to update delegator voting power' }, { status: 500 })
      }

      const { data: delegateBalance, error: delegateBalanceError } = await supabase
        .from('token_balances')
        .select('*')
        .eq('user_id', delegateId)
        .single()

      let currentDelegateBalance = delegateBalance
      if (delegateBalanceError || !delegateBalance) {
        // Create balance if not exists
        const { data: insertData, error: insertError } = await supabase
          .from('token_balances')
          .insert({ user_id: delegateId, balance: 100, voting_power: 100 })
          .select()
          .single()

        if (insertError) {
          return NextResponse.json({ error: 'Failed to create delegate balance' }, { status: 500 })
        }
        currentDelegateBalance = insertData
      }

      const { error: updateDelegateError } = await supabase
        .from('token_balances')
        .update({ voting_power: delegateBalance.voting_power + difference })
        .eq('user_id', delegateId)

      if (updateDelegateError) {
        return NextResponse.json({ error: 'Failed to update delegate voting power' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error delegating tokens:', error)
    return NextResponse.json({ error: 'Failed to delegate tokens' }, { status: 500 })
  }
}