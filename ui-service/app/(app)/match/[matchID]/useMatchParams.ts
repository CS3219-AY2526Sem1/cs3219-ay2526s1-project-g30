// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UseMatchParamsResult {
  sessionId: string | null
  questionId: string | null
  programmingLanguage: string
}

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  'c++': 'cpp',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rust',
  typescript: 'typescript',
  ruby: 'ruby',
  swift: 'swift',
  kotlin: 'kotlin',
  php: 'php',
  csharp: 'csharp',
  'c#': 'csharp',
}

export function useMatchParams(paramsPromise: Promise<{ matchID: string }>): UseMatchParamsResult {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questionId, setQuestionId] = useState<string | null>(null)
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript')

  useEffect(() => {
    async function resolveParams() {
      const params = await paramsPromise
      const sid = params.matchID
      const qid = searchParams.get('questionID')
      const lang = searchParams.get('language')

      console.log('[Match Page] Loading params:', {
        sessionId: sid,
        questionId: qid,
        language: lang,
        timestamp: new Date().toISOString(),
      })

      if (!sid || !qid) {
        toast.error('Invalid match URL - missing session or question ID', { duration: 5000 })
        router.push('/home')
        return
      }

      setSessionId(sid)
      setQuestionId(qid)

      if (lang) {
        const monacoLang = LANGUAGE_MAP[lang.toLowerCase()] || 'javascript'
        setProgrammingLanguage(monacoLang)
      }
    }

    resolveParams()
  }, [paramsPromise, router, searchParams])

  return { sessionId, questionId, programmingLanguage }
}
