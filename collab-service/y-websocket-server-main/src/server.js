#!/usr/bin/env node

import WebSocket from 'ws'
import http from 'http'
import * as number from 'lib0/number'
import { setupWSConnection } from './utils.js'

const wss = new WebSocket.Server({ noServer: true })
const host = process.env.HOST || 'localhost'
const PORT = number.parseInt(process.env.PORT || '1234')

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

wss.on('connection', setupWSConnection)

server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
  wss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
    wss.emit('connection', ws, request)
  })
})

// server.listen(port, host, () => {
//   console.log(`running at '${host}' on port ${port}`)
// })

server.listen(PORT, '0.0.0.0', () => {
  // const os = require('os');
 // const interfaces = os.networkInterfaces();
  console.log(`Yjs WebSocket server running on port ${PORT}`);
  // console.log(`Batch interval: ${BATCH_INTERVAL}ms`);
  console.log(`Local: ws://localhost:${PORT}`);
  
  // Object.keys(interfaces).forEach(ifname => {
  //   interfaces[ifname].forEach(iface => {
  //     if (iface.family === 'IPv4' && !iface.internal) {
  //       console.log(`Network: ws://${iface.address}:${PORT}`);
  //     }
  //   });
  // });
});

// process.on('SIGINT', () => {
//   console.log('\nShutting down...');
//   wss.close(() => {
//     server.close(() => {
//       console.log('Server closed');
//       process.exit(0);
//     });
//   });
// });