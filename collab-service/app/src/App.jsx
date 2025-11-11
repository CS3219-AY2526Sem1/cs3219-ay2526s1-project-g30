import { useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Editor from "@monaco-editor/react"
import * as Y from "yjs"
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from "y-monaco"

function App() {

  // const SERVER = 'https://cs3219-ay2526s1-project-g30-322773842817.asia-southeast1.run.app' // Collab server address with port
  const SERVER = 'ws://192.168.1.50:1234'
  const ROOM = '345eaf569421111' // SESSION ID
  const USERID = '6904fbe3b11601119f005c7f'
  let undoManager

  const editorRef= useRef(null)

  function handleEditorDidMount(editor, monaco) {
    connectToChat()
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
          userid: USERID,
          purpose: "doc"
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
      provider.disconnect()
    })
    
    const type = doc.getText("monaco");

    // Trying to put Presence of other user
    
    const awareness = provider.awareness
    // You can observe when a user updates their awareness information
    awareness.on('change', changes => {
      // Whenever somebody updates their awareness information,
      // we log all awareness information from all users.
      console.log(Array.from(awareness.getStates().values()))
    })
    /*
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
  }

  function connectToChat() {
    const params = "?userid=" + USERID + "&purpose=chat"
    const chatConnection = new WebSocket(SERVER + "/" + ROOM + params)

    chatConnection.addEventListener("open", () => {
      console.log("Connecting to chat")
    });

    chatConnection.addEventListener("error", (e) => {
      console.log(`ERROR`)
      console.error(e)
    });

    chatConnection.addEventListener("message", (msg) => {
      const content = JSON.parse(msg.data)
      console.log(content.type)
      if (content.type === 'JoinChat') {
        if (content.status === 'Success') {
          console.log("Successfully connected and established ws")
        }
      }
      else if (content.type === 'ChatMessage') {
        const user = content.userid
        const text = content.content
        console.log(user, `sent`, text)
      }
      else if (content.type === 'ChatNotif') {
        console.log(content.content)
      }
    })

    chatConnection.addEventListener("close", (event) => {
      console.log(event)
      console.log("Disconnected from ws")
      if (event.code === 3000) {
        // This is when session has ended (same as for the other web socket also)
      } else {
        console.log("uncaught close code")
      }
      if (!event.wasClean) { // Try to reconnect if the closure was not expected
        setTimeout(function() {
          connect();
        }, 1000);
      }
    })
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
