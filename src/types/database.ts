export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'creator' | 'user'
          wallet_balance: number
          monthly_budget: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'creator' | 'user'
          wallet_balance?: number
          monthly_budget?: number | null
        }
        Update: {
          role?: 'creator' | 'user'
          wallet_balance?: number
          monthly_budget?: number | null
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string
          status: string
          category: string
          pricing_type: string
          price_details: any
          api_endpoint: string
          max_concurrent_requests: number
          created_at: string
          updated_at: string
        }
        Insert: {
          creator_id: string
          name: string
          description: string
          status: string
          category: string
          pricing_type: string
          price_details: any
          api_endpoint: string
          max_concurrent_requests: number
        }
        Update: {
          name?: string
          description?: string
          status?: string
          category?: string
          pricing_type?: string
          price_details?: any
          api_endpoint?: string
          max_concurrent_requests?: number
          updated_at?: string
        }
      }
      executions: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          goal: string
          status: string
          token_cost: number
          total_cost: number
          time_taken_ms: number
          results: any
          decision_hashes: any
          created_at: string
        }
        Insert: {
          user_id: string
          agent_id: string
          goal: string
          status: string
          token_cost: number
          total_cost: number
          time_taken_ms: number
          results: any
          decision_hashes: any
        }
        Update: {
          status?: string
          token_cost?: number
          total_cost?: number
          time_taken_ms?: number
          results?: any
          decision_hashes?: any
        }
      }
      earnings: {
        Row: {
          id: string
          agent_id: string
          revenue_amount: number
          platform_fee: number
          timestamp: string
        }
        Insert: {
          agent_id: string
          revenue_amount: number
          platform_fee: number
        }
        Update: {
          revenue_amount?: number
          platform_fee?: number
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          details: any
          timestamp: string
        }
        Insert: {
          user_id: string
          type: string
          amount: number
          details: any
        }
        Update: {
          type?: string
          amount?: number
          details?: any
        }
      }
    }
  }
}