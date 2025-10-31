'use client'

import { useRef } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'

interface CodeEditorProps {
  language?: string
  defaultValue?: string
  value?: string
  onChange?: (value: string | undefined) => void
  readOnly?: boolean
  theme?: string
  // Future collab service integration parameters
  sessionId?: string
  userId?: string
  onEditorReady?: (editor: any, monaco: Monaco) => void
}

export function CodeEditor({
  language = 'javascript',
  defaultValue = '// Start coding here...',
  value,
  onChange,
  readOnly = false,
  theme = 'vs-dark',
  sessionId,
  userId,
  onEditorReady,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Set EOL character to be \n for cross-platform consistency
    const model = editor.getModel()
    if (model) {
      model.setEOL(0) // 0 = LF (\n), 1 = CRLF (\r\n)
    }

    // Call the onEditorReady callback if provided (for future YJS integration)
    if (onEditorReady) {
      onEditorReady(editor, monaco)
    }
  }

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      theme={theme}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        minimap: { enabled: true },
        wordWrap: 'on',
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        insertSpaces: true,
        scrollBeyondLastLine: false,
        fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, source-code-pro, monospace',
        fontSize: 14,
        lineNumbersMinChars: 3,
        padding: { top: 16, bottom: 16 },
      }}
    />
  )
}
