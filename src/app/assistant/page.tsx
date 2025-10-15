'use client'

import { StandaloneAIAssistant } from '@/components/StandaloneAIAssistant'
import { useRouter } from 'next/navigation'

export default function AssistantPage() {
  const router = useRouter()

  const handleDeveloperMode = () => {
    router.push('/auth/login')
  }

  return (
    <StandaloneAIAssistant 
      onDeveloperMode={handleDeveloperMode}
      showDeveloperButton={true}
      title="Orca Network AI"
      subtitle="Your intelligent agent network companion"
    />
  )
}