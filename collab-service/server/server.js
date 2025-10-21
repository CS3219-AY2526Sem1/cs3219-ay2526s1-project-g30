const WebSocket = require('ws');
const http = require('http');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const map = require('lib0/map');

const PORT = process.env.PORT || 1234;
const BATCH_INTERVAL = 10; // Batch updates every 10ms

const docs = new Map();
const messageSync = 0;
const messageAwareness = 1;

class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super();
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    
    // Batching mechanism
    this.pendingUpdates = new Map();
    this.batchTimeout = null;
  }
  
  // Queue updates for batching
  queueUpdate(conn, message) {
    if (!this.pendingUpdates.has(conn)) {
      this.pendingUpdates.set(conn, []);
    }
    this.pendingUpdates.get(conn).push(message);
    
    // Schedule batch send if not already scheduled
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushUpdates();
      }, BATCH_INTERVAL);
    }
  }
  
  // Send all batched updates
  flushUpdates() {
    this.pendingUpdates.forEach((messages, targetConn) => {
      if (targetConn.readyState === WebSocket.OPEN) {
        messages.forEach(msg => {
          try {
            targetConn.send(msg);
          } catch (err) {
            console.error('Error sending batched update:', err);
          }
        });
      }
    });
    this.pendingUpdates.clear();
    this.batchTimeout = null;
  }
}

const getYDoc = (docname, gc = true) => map.setIfUndefined(docs, docname, () => {
  const doc = new WSSharedDoc(docname);
  doc.gc = gc;
  
  // Broadcast document updates with batching
  doc.on('update', (update, origin) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    
    doc.conns.forEach((_, conn) => {
      if (conn !== origin) {
        // Queue for batching instead of immediate send
        doc.queueUpdate(conn, message);
      }
    });
  });
  
  return doc;
});

const messageListener = (conn, doc, message) => {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
        if (encoding.length(encoder) > 1) {
          conn.send(encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness:
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
    }
  } catch (err) {
    console.error('Error processing message:', err);
  }
};

const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );
  }
  conn.close();
};

const send = (doc, conn, m) => {
  if (conn.readyState !== WebSocket.CONNECTING && conn.readyState !== WebSocket.OPEN) {
    closeConn(doc, conn);
  }
  try {
    conn.send(m, err => {
      if (err != null) closeConn(doc, conn);
    });
  } catch (e) {
    closeConn(doc, conn);
  }
};

const pingTimeout = 30000;

const setupWSConnection = (conn, req) => {
  const docName = req.url.slice(1).split('?')[0];
  conn.binaryType = 'arraybuffer';
  const doc = getYDoc(docName, true);
  doc.conns.set(conn, new Set());

  conn.on('message', message => messageListener(conn, doc, new Uint8Array(message)));

  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);

  conn.on('close', () => {
    // Flush any pending updates before closing
    if (doc.batchTimeout) {
      clearTimeout(doc.batchTimeout);
      doc.flushUpdates();
    }
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });

  conn.on('pong', () => {
    pongReceived = true;
  });

  // Send sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  send(doc, conn, encoding.toUint8Array(encoder));

  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
    );
    send(doc, conn, encoding.toUint8Array(encoder));
  }
};

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Yjs WebSocket Server\nBatch Interval: ${BATCH_INTERVAL}ms\n`);
});

const wss = new WebSocket.Server({ server });
wss.on('connection', setupWSConnection);

server.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log(`Yjs WebSocket server running on port ${PORT}`);
  console.log(`Batch interval: ${BATCH_INTERVAL}ms`);
  console.log(`Local: ws://localhost:${PORT}`);
  
  Object.keys(interfaces).forEach(ifname => {
    interfaces[ifname].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Network: ws://${iface.address}:${PORT}`);
      }
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});