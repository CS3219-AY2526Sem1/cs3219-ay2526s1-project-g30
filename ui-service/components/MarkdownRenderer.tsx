// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Haiku 4.5 & Claude Sonnet 4.5), date: 2025‑11-11
// Scope: Generated implementation based on component specifications.
// Author review: Validated correctness, fixed bugs

'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  textSize?: number
  isDark?: boolean
  isCompact?: boolean
}

function createComponents({
  textSize,
  isDark,
  isCompact,
}: {
  textSize: number
  isDark: boolean
  isCompact: boolean
}) {
  return {
    h1: ({ node, ...props }: any) => (
      <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-base font-semibold mt-2 mb-1" {...props} />
    ),
    h4: ({ node, ...props }: any) => <h4 className="font-semibold" {...props} />,
    h5: ({ node, ...props }: any) => <h5 className="font-semibold" {...props} />,
    h6: ({ node, ...props }: any) => <h6 className="font-semibold" {...props} />,

    p: ({ node, ...props }: any) => (
      <p
        className={cn('leading-relaxed', !isCompact && 'mb-3')}
        style={{ fontSize: `${textSize}px` }}
        {...props}
      />
    ),

    ul: ({ node, ...props }: any) => (
      <ul
        className={cn('list-disc list-inside space-y-1', !isCompact && 'mb-3')}
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol
        className={cn('list-decimal list-inside space-y-1', !isCompact && 'mb-3')}
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => (
      <li style={{ fontSize: `${textSize}px` }} {...props} />
    ),

    pre: ({ node, ...props }: any) => (
      <pre
        className={cn(
          'border rounded-lg p-4 overflow-x-auto',
          isDark ? 'bg-white/20 border-white/20' : 'bg-muted border-border',
          !isCompact && 'mb-3',
        )}
        {...props}
      />
    ),
    code: ({ node, inline = false, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className={cn(
              'px-1.5 py-0.5 rounded text-sm font-mono',
              isDark ? 'bg-white/20' : 'bg-muted',
            )}
            {...props}
          >
            {children}
          </code>
        )
      }
      return (
        <code
          className="block font-mono text-sm"
          style={{ fontSize: `${textSize - 2}px` }}
          {...props}
        >
          {children}
        </code>
      )
    },

    blockquote: ({ node, ...props }: any) => (
      <blockquote
        className={cn(
          'border-l-4 border-primary pl-4 italic',
          !isCompact && 'my-3',
        )}
        {...props}
      />
    ),

    a: ({ node, ...props }: any) => (
      <a
        className="text-primary hover:underline wrap-break-word"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),

    hr: ({ node, ...props }: any) => (
      <hr className={cn('border-border', !isCompact && 'my-4')} {...props} />
    ),

    table: ({ node, ...props }: any) => (
      <table
        className={cn(
          'border-collapse border border-border',
          !isCompact && 'my-3',
        )}
        {...props}
      />
    ),
    thead: ({ node, ...props }: any) => (
      <thead className="bg-muted" {...props} />
    ),
    tbody: ({ node, ...props }: any) => <tbody {...props} />,
    tr: ({ node, ...props }: any) => (
      <tr className="border-b border-border" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className="border border-border px-3 py-2" {...props} />
    ),
    th: ({ node, ...props }: any) => (
      <th
        className="border border-border px-3 py-2 font-semibold bg-muted"
        {...props}
      />
    ),

    strong: ({ node, ...props }: any) => (
      <strong className="font-bold" {...props} />
    ),
    em: ({ node, ...props }: any) => <em className="italic" {...props} />,

    input: ({ node, type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled
            className="mr-2 cursor-not-allowed"
            {...props}
          />
        )
      }
      return <input type={type} {...props} />
    },

    br: ({ node, ...props }: any) => <br {...props} />,
  }
}

export function MarkdownRenderer({
  content,
  className,
  textSize = 14,
  isDark = false,
  isCompact = false,
}: MarkdownRendererProps) {
  const components = React.useMemo(
    () => createComponents({ textSize, isDark, isCompact }),
    [textSize, isDark, isCompact],
  )

  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
