import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const supabase = createClient()

    const { data: delegations, error } = await supabase
      .from('token_delegations')
      .select(`
        *,
        delegator:profiles!delegator_id(id, email),
        delegate:profiles!delegate_id(id, email)
      `)
      .or(`delegator_id.eq.${userId},delegate_id.eq.${userId}`)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch delegations' }, { status: 500 })
    }

    return NextResponse.json(delegations)
  } catch (error) {
    console.error('Error fetching delegations:', error)
    return NextResponse.json({ error: 'Failed to fetch delegations' }, { status: 500 })
  }
}