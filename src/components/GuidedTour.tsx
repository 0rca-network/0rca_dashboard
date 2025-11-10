'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

interface GuidedTourProps {
  isVisible: boolean
  onComplete: () => void
  userRole: 'creator' | 'user'
}

const creatorTourSteps: TourStep[] = [
  {
    id: 'my-agents',
    title: 'My Agents',
    description: 'Create and manage your AI agents here. Set pricing, configure API endpoints, and monitor performance.',
    targetSelector: '[data-tour="my-agents"]',
    position: 'right'
  },
  {
    id: 'earnings',
    title: 'Earnings',
    description: 'Monitor your revenue, track payouts, and view detailed earnings breakdown from your agents.',
    targetSelector: '[data-tour="earnings"]',
    position: 'right'
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'Track your agent performance, success rates, response times, and revenue analytics.',
    targetSelector: '[data-tour="analytics"]',
    position: 'right'
  }
]

const userTourSteps: TourStep[] = [
  {
    id: 'orchestrator',
    title: 'Orchestrator Console',
    description: 'Execute complex tasks using AI agents. Set your budget and let the system find the best agents for your needs.',
    targetSelector: '[data-tour="orchestrator"]',
    position: 'right'
  },
  {
    id: 'history',
    title: 'Execution History',
    description: 'View all your past executions with detailed breakdowns of costs, agents used, and results.',
    targetSelector: '[data-tour="history"]',
    position: 'right'
  },
  {
    id: 'discovery',
    title: 'Agent Discovery',
    description: 'Browse and discover AI agents created by the community. Filter by category, price, and performance.',
    targetSelector: '[data-tour="discovery"]',
    position: 'right'
  },
  {
    id: 'wallet',
    title: 'Wallet Management',
    description: 'Manage your balance, set monthly budgets, and track your spending across all agent executions.',
    targetSelector: '[data-tour="wallet"]',
    position: 'right'
  }
]

export function GuidedTour({ isVisible, onComplete, userRole }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tourSteps] = useState(userRole === 'creator' ? creatorTourSteps : userTourSteps)
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isVisible && tourSteps[currentStep]) {
      const updatePosition = () => {
        const target = document.querySelector(tourSteps[currentStep].targetSelector)
        if (target) {
          const rect = target.getBoundingClientRect()
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
          
          let top = rect.top + scrollTop
          let left = rect.left + scrollLeft
          
          // Position popup next to the target element
          switch (tourSteps[currentStep].position) {
            case 'right':
              left = rect.right + scrollLeft + 15
              top = rect.top + scrollTop - 50
              break
            case 'left':
              left = rect.left + scrollLeft - 335
              top = rect.top + scrollTop - 50
              break
            case 'bottom':
              top = rect.bottom + scrollTop + 15
              left = rect.left + scrollLeft - 100
              break
            case 'top':
              top = rect.top + scrollTop - 235
              left = rect.left + scrollLeft - 100
              break
          }
          
          setTargetPosition({ top, left })
        }
      }

      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(updatePosition, 100)
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition)
      }
    }
  }, [currentStep, isVisible, tourSteps])

  if (!isVisible || !tourSteps[currentStep]) return null

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleEnd = () => {
    onComplete()
  }

  const currentTourStep = tourSteps[currentStep]

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />
      
      {/* Tour Popup */}
      <div
        className="fixed z-[9999] w-80 bg-gradient-to-br from-[#64f2d1] to-[#22d3ee] rounded-lg shadow-2xl border border-[#64f2d1]/30"
        style={{
          top: `${targetPosition.top}px`,
          left: `${targetPosition.left}px`,
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg">{currentTourStep.title}</h3>
            <Button
              onClick={handleEnd}
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/20 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-white/90 text-sm mb-6 leading-relaxed">
            {currentTourStep.description}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/70 mb-2">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              onClick={handleNext}
              className="bg-white text-cyan-700 hover:bg-white/90 font-medium"
            >
              {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
            </Button>
            <Button
              onClick={handleEnd}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/20"
            >
              End Tour
            </Button>
          </div>
        </div>

        {/* Arrow pointer */}
        <div
          className={`absolute w-0 h-0 ${
            currentTourStep.position === 'right'
              ? '-left-3 top-16 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-cyan-600'
              : currentTourStep.position === 'left'
              ? '-right-3 top-16 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px] border-l-cyan-600'
              : currentTourStep.position === 'bottom'
              ? '-top-3 left-24 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-cyan-600'
              : '-bottom-3 left-24 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-cyan-600'
          }`}
        />
      </div>
    </>
  )
}