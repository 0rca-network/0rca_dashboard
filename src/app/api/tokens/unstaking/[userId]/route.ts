import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const supabase = createClient()

    const { data: requests, error } = await supabase
      .from('unstaking_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch unstaking requests' }, { status: 500 })
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching unstaking requests:', error)
    return NextResponse.json({ error: 'Failed to fetch unstaking requests' }, { status: 500 })
  }
}