import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useProfile() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return data
    },
    staleTime: Infinity,
  })
}

export function useAgents(creatorId?: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['agents', creatorId],
    queryFn: async () => {
      if (!creatorId) return []
      
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })

      return data || []
    },
    enabled: !!creatorId,
    staleTime: Infinity,
  })
}

export function useExecutions(userId?: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['executions', userId],
    queryFn: async () => {
      if (!userId) return []
      
      const { data } = await supabase
        .from('executions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      return data || []
    },
    enabled: !!userId,
    staleTime: Infinity,
  })
}