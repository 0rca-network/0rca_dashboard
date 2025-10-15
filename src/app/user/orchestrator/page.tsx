'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Play, Zap, DollarSign, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function OrchestratorPage() {
  const [goal, setGoal] = useState('')
  const [budget, setBudget] = useState([10])
  const [isRunning, setIsRunning] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const handleRunExecution = async () => {
    if (!goal.trim()) {
      toast({
        title: "Error",
        description: "Please enter a goal for the execution",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Simulate execution process
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Mock execution result
      const mockResult = {
        id: Math.random().toString(36).substr(2, 9),
        status: 'completed',
        token_cost: Math.floor(Math.random() * 500) + 100,
        total_cost: (Math.random() * budget[0]).toFixed(2),
        time_taken_ms: Math.floor(Math.random() * 5000) + 1000,
        results: {
          summary: 'Task completed successfully',
          agents_used: ['NLP Analyzer', 'Data Processor', 'Text Summarizer'],
          output: 'Generated comprehensive analysis based on your requirements.'
        },
        decision_hashes: {
          agent_selection: 'hash123',
          execution_path: 'hash456'
        }
      }

      // Save to database
      const { error } = await supabase
        .from('executions')
        .insert({
          user_id: user.id,
          agent_id: 'mock-agent-id',
          goal: goal,
          status: mockResult.status,
          token_cost: mockResult.token_cost,
          total_cost: parseFloat(mockResult.total_cost),
          time_taken_ms: mockResult.time_taken_ms,
          results: mockResult.results,
          decision_hashes: mockResult.decision_hashes
        })

      if (error) throw error

      setExecutionResult(mockResult)
      toast({
        title: "Success",
        description: "Execution completed successfully!",
      })

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute task",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orchestrator Console</h1>
        <p className="text-muted-foreground">Execute complex tasks using AI agent compositions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Execution Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="mr-2 h-4 w-4" />
              Task Configuration
            </CardTitle>
            <CardDescription>Define your goal and execution parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="goal">Goal / Query</Label>
              <Textarea
                id="goal"
                placeholder="Describe what you want to accomplish..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label>Max Budget: ${budget[0]}</Label>
              <Slider
                value={budget}
                onValueChange={setBudget}
                max={100}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>$1</span>
                <span>$100</span>
              </div>
            </div>

            <Button 
              onClick={handleRunExecution} 
              disabled={isRunning || !goal.trim()}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Execution
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Execution Status */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Status</CardTitle>
            <CardDescription>Real-time execution progress and results</CardDescription>
          </CardHeader>
          <CardContent>
            {isRunning ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 animate-spin" />
                  <span>Analyzing task requirements...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 animate-spin" />
                  <span>Selecting optimal agents...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 animate-spin" />
                  <span>Executing agent composition...</span>
                </div>
              </div>
            ) : executionResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {executionResult.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tokens Used</p>
                      <p className="font-medium">{executionResult.token_cost.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="font-medium">${executionResult.total_cost}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{(executionResult.time_taken_ms / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Agents Used</p>
                      <p className="font-medium">{executionResult.results.agents_used.length}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Result:</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{executionResult.results.output}</p>
                </div>

                <div>
                  <p className="font-medium mb-2">Agents Used:</p>
                  <div className="flex flex-wrap gap-2">
                    {executionResult.results.agents_used.map((agent: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Play className="mx-auto h-12 w-12 mb-4" />
                <p>Configure your task and click "Run Execution" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Examples</CardTitle>
          <CardDescription>Try these sample tasks to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Data Analysis",
                description: "Analyze sales data and generate insights",
                example: "Analyze the quarterly sales data and identify trends, top-performing products, and areas for improvement."
              },
              {
                title: "Content Generation",
                description: "Create marketing content",
                example: "Generate a comprehensive marketing campaign for a new eco-friendly product launch targeting millennials."
              },
              {
                title: "Research Summary",
                description: "Summarize research papers",
                example: "Summarize the latest research on artificial intelligence in healthcare and highlight key findings."
              }
            ].map((example, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                   onClick={() => setGoal(example.example)}>
                <h3 className="font-medium mb-2">{example.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{example.description}</p>
                <p className="text-xs text-blue-600">Click to use this example</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}