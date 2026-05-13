'use client'

import { useState, useEffect } from 'react'

export function usePlan() {
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/plan')
      .then(r => r.json())
      .then(d => setPlan(d.plan || 'starter'))
      .catch(() => setPlan('starter'))
  }, [])

  return {
    plan,
    loading: plan === null,
    isPro: plan !== null && ['pro', 'enterprise', 'admin'].includes(plan),
  }
}
