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
}

interface MarkdownRendererInternalProps extends MarkdownRendererProps {
  isCompact?: boolean
}

/**
 * MarkdownRenderer component provides consistent Markdown rendering across the application.
 * Supports GitHub-flavoured Markdown including tables, strikethrough, and task lists.
 * Styling is automatically applied to match the design system.
 * 
 * @param isCompact - When true, removes extra margins/padding for inline content (e.g., chat messages)
 * @param isDark - When true, uses darker backgrounds for code blocks (for light text contexts like sent messages)
 */
export function MarkdownRenderer({
  content,
  className,
  textSize = 14,
  isCompact = false,
  isDark = false,
}: MarkdownRendererInternalProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
        // Headings
        h1: ({ node, ...props }) => (
          <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-base font-semibold mt-2 mb-1" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="font-semibold" {...props} />
        ),
        h5: ({ node, ...props }) => (
          <h5 className="font-semibold" {...props} />
        ),
        h6: ({ node, ...props }) => (
          <h6 className="font-semibold" {...props} />
        ),

        // Paragraph
        p: ({ node, ...props }) => (
          <p
            className={cn('leading-relaxed', !isCompact && 'mb-3')}
            style={{ fontSize: `${textSize}px` }}
            {...props}
          />
        ),

        // Lists
        ul: ({ node, ...props }) => (
          <ul className={cn('list-disc list-inside space-y-1', !isCompact && 'mb-3')} {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className={cn('list-decimal list-inside space-y-1', !isCompact && 'mb-3')} {...props} />
        ),
        li: ({ node, ...props }) => (
          <li style={{ fontSize: `${textSize}px` }} {...props} />
        ),

        // Code blocks
        pre: ({ node, ...props }) => (
          <pre className={cn(
            'border rounded-lg p-4 overflow-x-auto',
            isDark ? 'bg-white/20 border-white/20' : 'bg-muted border-border',
            !isCompact && 'mb-3'
          )} {...props} />
        ),
        code: ({ node, inline = false, children, ...props }: any) => {
          if (inline) {
            return (
              <code
                className={cn(
                  'px-1.5 py-0.5 rounded text-sm font-mono',
                  isDark ? 'bg-white/20' : 'bg-muted'
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

        // Blockquote
        blockquote: ({ node, ...props }) => (
          <blockquote
            className={cn('border-l-4 border-primary pl-4 italic', !isCompact && 'my-3')}
            {...props}
          />
        ),

        // Links
        a: ({ node, ...props }) => (
          <a
            className="text-primary hover:underline wrap-break-word"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),

        // Horizontal rule
        hr: ({ node, ...props }) => <hr className={cn('border-border', !isCompact && 'my-4')} {...props} />,

        // Table (GitHub-flavoured Markdown)
        table: ({ node, ...props }) => (
          <table className={cn('border-collapse border border-border', !isCompact && 'my-3')} {...props} />
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-muted" {...props} />
        ),
        tbody: ({ node, ...props }) => <tbody {...props} />,
        tr: ({ node, ...props }) => (
          <tr className="border-b border-border" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-border px-3 py-2" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="border border-border px-3 py-2 font-semibold bg-muted" {...props} />
        ),

        // Strong and emphasis
        strong: ({ node, ...props }) => (
          <strong className="font-bold" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic" {...props} />
        ),

        // Task lists (GitHub-flavoured Markdown)
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

        // Break
        br: ({ node, ...props }) => <br {...props} />,
        }} 
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
