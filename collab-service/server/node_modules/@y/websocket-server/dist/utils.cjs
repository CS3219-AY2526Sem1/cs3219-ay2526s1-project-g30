'use strict';

var Y = require('yjs');
var syncProtocol = require('y-protocols/sync');
var awarenessProtocol = require('y-protocols/awareness');
var encoding = require('lib0/encoding');
var decoding = require('lib0/decoding');
var map = require('lib0/map');
var eventloop = require('lib0/eventloop');
var yLeveldb = require('y-leveldb');
var callback = require('./callback.cjs');
require('http');
require('lib0/number');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var Y__namespace = /*#__PURE__*/_interopNamespaceDefault(Y);
var syncProtocol__namespace = /*#__PURE__*/_interopNamespaceDefault(syncProtocol);
var awarenessProtocol__namespace = /*#__PURE__*/_interopNamespaceDefault(awarenessProtocol);
var encoding__namespace = /*#__PURE__*/_interopNamespaceDefault(encoding);
var decoding__namespace = /*#__PURE__*/_interopNamespaceDefault(decoding);
var map__namespace = /*#__PURE__*/_interopNamespaceDefault(map);
var eventloop__namespace = /*#__PURE__*/_interopNamespaceDefault(eventloop);

const CALLBACK_DEBOUNCE_WAIT = parseInt(process.env.CALLBACK_DEBOUNCE_WAIT || '2000');
const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT || '10000');

const debouncer = eventloop__namespace.createDebouncer(CALLBACK_DEBOUNCE_WAIT, CALLBACK_DEBOUNCE_MAXWAIT);

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';
const persistenceDir = process.env.YPERSISTENCE;
/**
 * @type {{bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise<any>, provider: any}|null}
 */
let persistence = null;
if (typeof persistenceDir === 'string') {
  console.info('Persisting documents to "' + persistenceDir + '"');
  // @ts-ignore
  const ldb = new yLeveldb.LeveldbPersistence(persistenceDir);
  persistence = {
    provider: ldb,
    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y__namespace.encodeStateAsUpdate(ydoc);
      ldb.storeUpdate(docName, newUpdates);
      Y__namespace.applyUpdate(ydoc, Y__namespace.encodeStateAsUpdate(persistedYdoc));
      ydoc.on('update', update => {
        ldb.storeUpdate(docName, update);
      });
    },
    writeState: async (_docName, _ydoc) => {}
  };
}

/**
 * @param {{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>,provider:any}|null} persistence_
 */
const setPersistence = persistence_ => {
  persistence = persistence_;
};

/**
 * @return {null|{bindState: function(string,WSSharedDoc):void,
  * writeState:function(string,WSSharedDoc):Promise<any>}|null} used persistence layer
  */
const getPersistence = () => persistence;

/**
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map();

const messageSync = 0;
const messageAwareness = 1;
// const messageAuth = 2

/**
 * @param {Uint8Array} update
 * @param {any} _origin
 * @param {WSSharedDoc} doc
 * @param {any} _tr
 */
const updateHandler = (update, _origin, doc, _tr) => {
  const encoder = encoding__namespace.createEncoder();
  encoding__namespace.writeVarUint(encoder, messageSync);
  syncProtocol__namespace.writeUpdate(encoder, update);
  const message = encoding__namespace.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));
};

/**
 * @type {(ydoc: Y.Doc) => Promise<void>}
 */
let contentInitializor = _ydoc => Promise.resolve();

/**
 * This function is called once every time a Yjs document is created. You can
 * use it to pull data from an external source or initialize content.
 *
 * @param {(ydoc: Y.Doc) => Promise<void>} f
 */
const setContentInitializor = (f) => {
  contentInitializor = f;
};

class WSSharedDoc extends Y__namespace.Doc {
  /**
   * @param {string} name
   */
  constructor (name) {
    super({ gc: gcEnabled });
    this.name = name;
    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     * @type {Map<Object, Set<number>>}
     */
    this.conns = new Map();
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = new awarenessProtocol__namespace.Awareness(this);
    this.awareness.setLocalState(null);
    /**
     * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
     * @param {Object | null} conn Origin is the connection that made the change
     */
    const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs = /** @type {Set<number>} */ (this.conns.get(conn));
        if (connControlledIDs !== undefined) {
          added.forEach(clientID => { connControlledIDs.add(clientID); });
          removed.forEach(clientID => { connControlledIDs.delete(clientID); });
        }
      }
      // broadcast awareness update
      const encoder = encoding__namespace.createEncoder();
      encoding__namespace.writeVarUint(encoder, messageAwareness);
      encoding__namespace.writeVarUint8Array(encoder, awarenessProtocol__namespace.encodeAwarenessUpdate(this.awareness, changedClients));
      const buff = encoding__namespace.toUint8Array(encoder);
      this.conns.forEach((_, c) => {
        send(this, c, buff);
      });
    };
    this.awareness.on('update', awarenessChangeHandler);
    this.on('update', /** @type {any} */ (updateHandler));
    if (callback.isCallbackSet) {
      this.on('update', (_update, _origin, doc) => {
        debouncer(() => callback.callbackHandler(/** @type {WSSharedDoc} */ (doc)));
      });
    }
    this.whenInitialized = contentInitializor(this);
  }
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
const getYDoc = (docname, gc = true) => map__namespace.setIfUndefined(docs, docname, () => {
  const doc = new WSSharedDoc(docname);
  doc.gc = gc;
  if (persistence !== null) {
    persistence.bindState(docname, doc);
  }
  docs.set(docname, doc);
  return doc
});

/**
 * @param {any} conn
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
const messageListener = (conn, doc, message) => {
  try {
    const encoder = encoding__namespace.createEncoder();
    const decoder = decoding__namespace.createDecoder(message);
    const messageType = decoding__namespace.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding__namespace.writeVarUint(encoder, messageSync);
        syncProtocol__namespace.readSyncMessage(decoder, encoder, doc, conn);

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (encoding__namespace.length(encoder) > 1) {
          send(doc, conn, encoding__namespace.toUint8Array(encoder));
        }
        break
      case messageAwareness: {
        awarenessProtocol__namespace.applyAwarenessUpdate(doc.awareness, decoding__namespace.readVarUint8Array(decoder), conn);
        break
      }
    }
  } catch (err) {
    console.error(err);
    // @ts-ignore
    doc.emit('error', [err]);
  }
};

/**
 * @param {WSSharedDoc} doc
 * @param {any} conn
 */
const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    /**
     * @type {Set<number>}
     */
    // @ts-ignore
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    awarenessProtocol__namespace.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
    if (doc.conns.size === 0 && persistence !== null) {
      // if persisted, we store state and destroy ydocument
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });
      docs.delete(doc.name);
    }
  }
  conn.close();
};

/**
 * @param {WSSharedDoc} doc
 * @param {import('ws').WebSocket} conn
 * @param {Uint8Array} m
 */
const send = (doc, conn, m) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn);
  }
  try {
    conn.send(m, {}, err => { err != null && closeConn(doc, conn); });
  } catch (e) {
    closeConn(doc, conn);
  }
};

const pingTimeout = 30000;

/**
 * @param {import('ws').WebSocket} conn
 * @param {import('http').IncomingMessage} req
 * @param {any} opts
 */
const setupWSConnection = (conn, req, { docName = (req.url || '').slice(1).split('?')[0], gc = true } = {}) => {
  conn.binaryType = 'arraybuffer';
  // get doc, initialize if it does not exist yet
  const doc = getYDoc(docName, gc);
  doc.conns.set(conn, new Set());
  // listen and reply to events
  conn.on('message', /** @param {ArrayBuffer} message */ message => messageListener(conn, doc, new Uint8Array(message)));

  // Check if connection is still alive
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
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
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });
  conn.on('pong', () => {
    pongReceived = true;
  });
  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = encoding__namespace.createEncoder();
    encoding__namespace.writeVarUint(encoder, messageSync);
    syncProtocol__namespace.writeSyncStep1(encoder, doc);
    send(doc, conn, encoding__namespace.toUint8Array(encoder));
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = encoding__namespace.createEncoder();
      encoding__namespace.writeVarUint(encoder, messageAwareness);
      encoding__namespace.writeVarUint8Array(encoder, awarenessProtocol__namespace.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
      send(doc, conn, encoding__namespace.toUint8Array(encoder));
    }
  }
};

exports.WSSharedDoc = WSSharedDoc;
exports.docs = docs;
exports.getPersistence = getPersistence;
exports.getYDoc = getYDoc;
exports.setContentInitializor = setContentInitializor;
exports.setPersistence = setPersistence;
exports.setupWSConnection = setupWSConnection;
//# sourceMappingURL=utils.cjs.map
