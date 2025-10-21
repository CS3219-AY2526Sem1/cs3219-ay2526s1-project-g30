import { useReducer, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Editor from "@monaco-editor/react"
import * as Y from "yjs"
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from "y-monaco"


function App() {
  const editorRef= useRef(null)

  

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    // Initialize the YJS
    const doc = new Y.Doc();

    // Connect to server
    const provider = new WebsocketProvider(
      'ws://192.168.1.130:1234', 'monaco-editor-template', doc, {
    connect: true,
    // Disable awareness delay for immediate sync
    awarenessUpdateDelay: 0,
    
    // Reconnection settings
    maxBackoffTime: 2500,
    
    // Disable batching for immediate updates
    disableBc: false,
    
    // Connection parameters
    params: {
      // Add any auth params here if needed
    }
  }
    )
    const type = doc.getText("monaco");

    // Bind YJS to Monaco
    const binding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
    console.log(provider.awareness);
  }

  return (
    <Editor
      height="100vh"
      width="100vw"
      theme="vs-dark"
      onMount={handleEditorDidMount}
      defaultLanguage='python'
    />
  )
}

export default App
