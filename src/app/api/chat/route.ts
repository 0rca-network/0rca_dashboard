import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check if query is about database data
    let contextData = ''
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('proposal') || lowerMessage.includes('jithu')) {
      const { data: proposals } = await supabase
        .from('dao_proposals')
        .select('*')
        .eq('status', 'active')
      
      if (proposals && proposals.length > 0) {
        contextData = `\n\nCurrent active proposals in database: ${proposals.length} proposals found.\n${proposals.map(p => `- ${p.title} (Status: ${p.status}, Votes For: ${p.votes_for}, Votes Against: ${p.votes_against})`).join('\n')}`
      }
    }

    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant for Orca Network with real-time database access. You help users with:
- Agent creation and management
- Orchestrator usage and task execution
- Wallet management and billing
- Earnings tracking for creators
- DAO governance and treasury
- Token staking and rewards
- Platform features and navigation

When asked about specific data (proposals, users, agents), provide accurate information from the database context provided.${contextData}`
      },
      ...(conversationHistory || []),
      {
        role: 'user',
        content: message
      }
    ]

    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('Groq API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
