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
      token_balances: {
        Row: {
          id: string
          user_id: string
          balance: number
          staked_balance: number
          voting_power: number
          updated_at: string
        }
        Insert: {
          user_id: string
          balance?: number
          staked_balance?: number
          voting_power?: number
        }
        Update: {
          balance?: number
          staked_balance?: number
          voting_power?: number
          updated_at?: string
        }
      }
      dao_proposals: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          proposal_type: 'fee_change' | 'treasury' | 'feature' | 'agent_curation' | 'other'
          execution_data: any
          voting_starts_at: string
          voting_ends_at: string
          status: 'active' | 'passed' | 'failed' | 'executed'
          votes_for: number
          votes_against: number
          votes_abstain: number
          quorum_required: number
          created_at: string
        }
        Insert: {
          creator_id: string
          title: string
          description: string
          proposal_type: 'fee_change' | 'treasury' | 'feature' | 'agent_curation' | 'other'
          execution_data?: any
          voting_starts_at: string
          voting_ends_at: string
          status?: 'active' | 'passed' | 'failed' | 'executed'
          votes_for?: number
          votes_against?: number
          votes_abstain?: number
          quorum_required?: number
        }
        Update: {
          title?: string
          description?: string
          proposal_type?: 'fee_change' | 'treasury' | 'feature' | 'agent_curation' | 'other'
          execution_data?: any
          voting_starts_at?: string
          voting_ends_at?: string
          status?: 'active' | 'passed' | 'failed' | 'executed'
          votes_for?: number
          votes_against?: number
          votes_abstain?: number
          quorum_required?: number
        }
      }
      dao_votes: {
        Row: {
          id: string
          proposal_id: string
          voter_id: string
          vote_type: 'for' | 'against' | 'abstain'
          voting_power: number
          created_at: string
        }
        Insert: {
          proposal_id: string
          voter_id: string
          vote_type: 'for' | 'against' | 'abstain'
          voting_power: number
        }
        Update: {
          vote_type?: 'for' | 'against' | 'abstain'
          voting_power?: number
        }
      }
      dao_treasury: {
        Row: {
          id: string
          proposal_id: string | null
          transaction_type: 'revenue' | 'distribution' | 'grant' | 'expense'
          amount: number
          recipient_id: string | null
          description: string
          status: 'pending' | 'executed' | 'failed'
          created_at: string
        }
        Insert: {
          proposal_id?: string | null
          transaction_type: 'revenue' | 'distribution' | 'grant' | 'expense'
          amount: number
          recipient_id?: string | null
          description: string
          status?: 'pending' | 'executed' | 'failed'
        }
        Update: {
          proposal_id?: string | null
          transaction_type?: 'revenue' | 'distribution' | 'grant' | 'expense'
          amount?: number
          recipient_id?: string | null
          description?: string
          status?: 'pending' | 'executed' | 'failed'
        }
      }
      token_delegations: {
        Row: {
          id: string
          delegator_id: string
          delegate_id: string
          amount: number
          created_at: string
        }
        Insert: {
          delegator_id: string
          delegate_id: string
          amount: number
        }
        Update: {
          amount?: number
        }
      }
      unstaking_requests: {
        Row: {
          id: string
          user_id: string
          amount: number
          requested_at: string
          available_at: string
          status: 'pending' | 'completed'
          created_at: string
        }
        Insert: {
          user_id: string
          amount: number
          available_at: string
          status?: 'pending' | 'completed'
        }
        Update: {
          status?: 'pending' | 'completed'
        }
      }
    }
  }
}