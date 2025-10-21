#!/usr/bin/env node
'use strict';

var WebSocket = require('ws');
var http = require('http');
var number = require('lib0/number');
var utils = require('./utils.cjs');
require('yjs');
require('y-protocols/sync');
require('y-protocols/awareness');
require('lib0/encoding');
require('lib0/decoding');
require('lib0/map');
require('lib0/eventloop');
require('y-leveldb');
require('./callback.cjs');

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

var number__namespace = /*#__PURE__*/_interopNamespaceDefault(number);

const wss = new WebSocket.Server({ noServer: true });
const host = process.env.HOST || 'localhost';
const port = number__namespace.parseInt(process.env.PORT || '1234');

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

wss.on('connection', utils.setupWSConnection);

server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
  wss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
    wss.emit('connection', ws, request);
  });
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});
//# sourceMappingURL=server.cjs.map
