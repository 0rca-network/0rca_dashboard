import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const supabase = createClient()

    const { data: delegation, error: delegationError } = await supabase
      .from('token_delegations')
      .select('*')
      .eq('id', id)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 })
    }

    const amount = delegation.amount

    // Remove delegation
    const { error: deleteError } = await supabase
      .from('token_delegations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete delegation' }, { status: 500 })
    }

    // Update voting powers
    const { data: delegatorBalance, error: delegatorError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', delegation.delegator_id)
      .single()

    let currentDelegatorBalance = delegatorBalance
    if (delegatorError || !delegatorBalance) {
      // Create balance if not exists
      const { data: insertData, error: insertError } = await supabase
        .from('token_balances')
        .insert({ user_id: delegation.delegator_id, balance: 100, voting_power: 100 })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create delegator balance' }, { status: 500 })
      }
      currentDelegatorBalance = insertData
    }

    const { error: updateDelegatorError } = await supabase
      .from('token_balances')
      .update({ voting_power: currentDelegatorBalance.voting_power + amount })
      .eq('user_id', delegation.delegator_id)

    if (updateDelegatorError) {
      return NextResponse.json({ error: 'Failed to update delegator voting power' }, { status: 500 })
    }

    const { data: delegateBalance, error: delegateError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', delegation.delegate_id)
      .single()

    let currentDelegateBalance = delegateBalance
    if (delegateError || !delegateBalance) {
      // Create balance if not exists
      const { data: insertData, error: insertError } = await supabase
        .from('token_balances')
        .insert({ user_id: delegation.delegate_id, balance: 100, voting_power: 100 })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create delegate balance' }, { status: 500 })
      }
      currentDelegateBalance = insertData
    }

    const { error: updateDelegateError } = await supabase
      .from('token_balances')
      .update({ voting_power: currentDelegateBalance.voting_power - amount })
      .eq('user_id', delegation.delegate_id)

    if (updateDelegateError) {
      return NextResponse.json({ error: 'Failed to update delegate voting power' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking delegation:', error)
    return NextResponse.json({ error: 'Failed to revoke delegation' }, { status: 500 })
  }
}