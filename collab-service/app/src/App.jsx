import { useState, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Editor from "@monaco-editor/react"
import * as Y from "yjs"
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from "y-monaco"

function App() {

  const SERVER = 'https://cs3219-ay2526s1-project-g30-322773842817.asia-southeast1.run.app' // Collab server address with port
  // const SERVER = 'https://192.168.1.50:1234'
  const ROOM = 'monaco-editor-template09' // SESSION ID
  const USERID = 'uidUser1'
  let undoManager

  const editorRef= useRef(null)
  const containerRef = useRef(null)
  const [remoteCursors, setRemoteCursors] = useState({})

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    // Initialize the YJS doc
    const doc = new Y.Doc();

    // Connect to server
    const provider = new WebsocketProvider(
      SERVER, ROOM, doc, {
        connect: true, // Connect on mount
        awarenessUpdateDelay: 0, // Disable awareness delay for immediate sync
        maxBackoffTime: 2000, // Reconnection settings
        disableBc: false, // Disable batching for immediate updates
        // Connection parameters
        params: {
          // Add any auth params here if needed
          userid: USERID
        }
      }
    )
    provider.ws.addEventListener('close', event => {
      console.log("ws close listener hit")
      console.log(event)
      console.log(event.code)
      if (event.code === 1006) {
        // alert("Could not establish connection to server")
      } else if (event.code === 3000) {
        alert(event.reason)
      } else {
        console.log("uncaught close code")
      }
      if (event.wasClean) {
        provider.disconnect()
      }
    })
    
    const type = doc.getText("monaco");

    // Trying to put Presence of other user
    
    const awareness = provider.awareness

    const userName = 'User_' + Math.floor(Math.random() * 1000)
    const userColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    
    awareness.setLocalStateField('user', {
      name: userName,
      color: userColor
    })

    console.log('🟢 You are:', userName, userColor)

    // You can observe when a user updates their awareness information
    /*
    awareness.on('change', changes => {
      // Whenever somebody updates their awareness information,
      // we log all awareness information from all users.
      console.log(Array.from(awareness.getStates().values()))
    })
    
    awareness.setLocalStateField('user', {
      // Define a print name that should be displayed
      name: 'Emmanuelle Charpentier',
      // Define a color that should be associated to the user:
      color: '#ffb61e' // should be a hex color
    })
      */

    // Set the EOL character to be \n to sync across different OS
    editorRef.current.getModel().setEOL(0)

    // Bind YJS to Monaco
    const binding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);

    // Create undo manager
    undoManager = new Y.UndoManager(type, {
      captureTimeout: 50,
      trackedOrigins: new Set([binding]),
      ignoreRemoteMapChanges: true
    })
    
    // Store and restore cursor location on undo with UndoManager
    undoManager.on('stack-item-added', event => {
      // save the current cursor location on the stack-item
      event.stackItem.meta.set('cursor-location', editorRef.current.getPosition())
    })

    undoManager.on('stack-item-popped', event => {
      // restore the current cursor location on the stack-item
      const position = event.stackItem.meta.get('cursor-location');
      editor.setPosition(position);
      editor.revealPositionInCenter(position);
    })

    console.log(undoManager)

    // Bind editor undo to UndoManager
    editorRef.current.addAction({
      id: 'yjs-undo',
      label: 'Undo',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ],
      run: () => {
        console.log("undo")
        undoManager.undo()
      }
    })

    // Bind editor redo to UndoManager
    editorRef.current.addAction({
      id: 'yjs-redo',
      label: 'Redo',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ],
      run: () => {
        console.log("redo")
        undoManager.redo()
      }
    })
    console.log(provider.awareness);

    // Send cursor position to other users
    function updateLocalCursor() {
      const position = editor.getPosition()
      const selection = editor.getSelection()
      
      if (!position) return
      
      awareness.setLocalStateField('cursor', {
        position: { lineNumber: position.lineNumber, column: position.column },
        selection: selection ? {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        } : null,
        timestamp: Date.now()
      })
    }

    editor.onDidChangeCursorPosition(updateLocalCursor)
    editor.onDidChangeCursorSelection(updateLocalCursor)

    // Render remote cursors as HTML overlays
    function renderRemoteCursorsAsHTML() {
      const states = awareness.getStates()
      const localClientId = awareness.clientID
      const model = editor.getModel()
      
      if (!model) return

      const cursors = {}
      
      states.forEach((state, clientId) => {
        if (clientId === localClientId) return
        
        const user = state.user
        const cursor = state.cursor
        
        if (!user || !cursor || !cursor.position) return
        
        const { lineNumber, column } = cursor.position
        
        // Get pixel coordinates for the cursor position
        try {
          const coords = editor.getScrolledVisiblePosition({
            lineNumber: lineNumber,
            column: column
          })
          
          if (coords) {
            cursors[clientId] = {
              name: user.name,
              color: user.color,
              top: coords.top,
              left: coords.left,
              visible: true
            }
            
            console.log(`👤 ${user.name} cursor at line ${lineNumber}:${column} (${coords.left}px, ${coords.top}px)`)
          }
        } catch (error) {
          console.error('Error getting cursor position:', error)
        }
      })
      
      setRemoteCursors(cursors)
    }

    // Update cursors on awareness changes
    awareness.on('change', () => {
      console.log('🔄 Awareness changed, users:', awareness.getStates().size)
      renderRemoteCursorsAsHTML()
    })

    // Update cursors on scroll or content changes
    editor.onDidScrollChange(() => renderRemoteCursorsAsHTML())
    editor.onDidChangeModelContent(() => {
      setTimeout(renderRemoteCursorsAsHTML, 10)
    })

    // Initial render
    setTimeout(() => {
      renderRemoteCursorsAsHTML()
      updateLocalCursor()
    }, 10)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        onMount={handleEditorDidMount}
        defaultLanguage='python'
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          wordWrap: 'on'
        }}
      />
      
      {/* Render remote cursors as HTML overlays */}
      {Object.entries(remoteCursors).map(([clientId, cursor]) => (
        cursor.visible && (
          <div
            key={clientId}
            style={{
              position: 'absolute',
              left: `${cursor.left}px`,
              top: `${cursor.top}px`,
              pointerEvents: 'none',
              zIndex: 1000,
              transition: 'all 0.1s ease-out'
            }}
          >
            {/* Cursor line */}
            <div
              style={{
                width: '2px',
                height: '20px',
                backgroundColor: cursor.color,
                position: 'relative'
              }}
            />
            
            {/* Cursor label */}
            <div
              style={{
                position: 'absolute',
                top: '-22px',
                left: '0',
                backgroundColor: cursor.color,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '11px',
                fontFamily: 'sans-serif',
                whiteSpace: 'nowrap',
                fontWeight: '500'
              }}
            >
              {cursor.name}
            </div>
          </div>
        )
      ))}
      
      {/* Debug panel */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 10000
      }}>
        <div>Connected users: {Object.keys(remoteCursors).length + 1}</div>
        <div>Remote cursors visible: {Object.values(remoteCursors).filter(c => c.visible).length}</div>
      </div>
    </div>
  )
}

export default App
