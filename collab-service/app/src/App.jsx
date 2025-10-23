import { useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Editor from "@monaco-editor/react"
import * as Y from "yjs"
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from "y-monaco"

function App() {

  const SERVER = 'ws://192.168.1.50:1234' // Collab server address with port
  const ROOM = 'monaco-editor-template' // SESSION ID
  let undoManager

  const editorRef= useRef(null)

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    // Initialize the YJS doc
    const doc = new Y.Doc();

    // Connect to server
    const provider = new WebsocketProvider(
      SERVER, ROOM, doc, {
        connect: true, // Connect on mount
        awarenessUpdateDelay: 0, // Disable awareness delay for immediate sync
        maxBackoffTime: 2500, // Reconnection settings
        disableBc: false, // Disable batching for immediate updates
        // Connection parameters
        params: {
          // Add any auth params here if needed
        }
      }
    )
    
    const type = doc.getText("monaco");

    // Trying to put Presence of other user
    /*
    const awareness = provider.awareness
    // You can observe when a user updates their awareness information
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

    // Trying to recover cursor on undo and redo
    /*
    undoManager.on('stack-item-added', event => {
      // save the current cursor location on the stack-item
      event.stackItem.meta.set('cursor-location', getRelativeCursorLocation())
    })

    undoManager.on('stack-item-popped', event => {
      // restore the current cursor location on the stack-item
      restoreCursorLocation(event.stackItem.meta.get('cursor-location'))
    })*/

    console.log(undoManager)

    // Bind editor undo to UndoManager
    editorRef.current.addAction({
      id: 'yjs-undo',
      label: 'Undo',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ],
      run: () => {
        undoManager.undo()
      }
    })

    // Bind editor redo to UndoManager
    editorRef.current.addAction({
      id: 'yjs-redo',
      label: 'Redo',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ],
      run: () => {
        undoManager.redo()
      }
    })


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
