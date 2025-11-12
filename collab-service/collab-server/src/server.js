#!/usr/bin/env node

// Code credits to dmonad on Github and the respective collaborators
// Base code taken from https://github.com/yjs/y-websocket-server/tree/main
// Made extensive changes to suit needs of PeerPrep

// AI Assistance Disclosure:
// Tool: Claude AI (Sonnet 4.5), date: 2025‑10-05
// Scope: Debugging errors and issues with connecting with Cloud Run
// Author review: Validated correctness

import dotenv from 'dotenv'
import WebSocket from 'ws'
import http from 'http'
// import https from 'https'
// import fs from 'fs'
// import path from 'path'
import os from 'os'
import * as number from 'lib0/number.js'
import { Session } from './session.js'
import { setupWSConnection, createYDoc, sessions } from './utils.js'
import { MongoClient, MongoError } from 'mongodb'

// .env file config
dotenv.config()

// Other service set up
const questionService = process.env.QUESTION_SERVICE
const userService = process.env.USER_SERVICE

// MongoDB setup
// const mongoLocalUrl = 'mongodb://localhost:27017'
const mongoOnlineUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017'
const dbSessionName = 'session_storage'
const dbTemplateName = 'default_templates'
let dbSessions, dbTemplates
let dbConnectionPromise

// Connect to MongoDB
dbConnectionPromise = MongoClient.connect(mongoOnlineUrl, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  // CRITICAL: Add these TLS options
  tls: true,
  tlsAllowInvalidCertificates: true, // Needed for Cloud Run
  retryWrites: true,
  retryReads: true,
})
  .then(client => {
    console.log('Connected to MongoDB')
    dbSessions = client.db(dbSessionName).collection('sessions')
    dbTemplates = client.db(dbTemplateName).collection('templates')
    setInterval(() => {
        //closeInactiveSessionsInDb()
    }, 1000 * 60)
})
.catch(err => console.error('MongoDB connection error:', err))

async function ensureDbConnected() {
  if (!dbSessions || !dbTemplates) {
    console.log("Waiting for DB connection")
    await dbConnectionPromise
  }
  if (!dbSessions || !dbTemplates) {
    throw new Error('Database connection failed')
  }
}

// Function to load active sessions from MongoDB
async function loadActiveSessions() {
  try {
    await ensureDbConnected()
    
    const findResult = await dbSessions.find({ status: 'Active' })
    for await (const storedSession of findResult) {
      const newSession = new Session(storedSession.sessionId, storedSession.user1, storedSession.user2,
        storedSession.language, storedSession.question, storedSession.startTime)
      newSession.setYDoc(createYDoc(storedSession.sessionId, storedSession.content))
      console.log('Stored session retrieved (', storedSession.user1, ',', storedSession.user2, '):', storedSession.sessionId)
      sessions.set(storedSession.sessionId, newSession)
      
      const sessionTimeout = setTimeout(() => endSession(newSession, "Session has ended due to inactivity"), number.parseInt(process.env.SESSION_TIMEOUT || '3600000'))
      
      const scheduledUpdater = setInterval(async () => {
        try {
          if (newSession.updated) {
            sessionTimeout.refresh()
            const [query, update] = newSession.getUpdateDocJsonsified()
            await dbSessions.updateOne(query, update, {upsert: false} )
            console.log(storedSession.sessionId, 'content updated')
            newSession.updated = false
          }
        } catch (e) {
          console.error('Error updating session', storedSession.sessionId, ':', e)
        }
      }, number.parseInt(process.env.SESSION_UPDATE || '60000'))
      newSession.scheduledUpdater = scheduledUpdater
      newSession.sessionTimeout = sessionTimeout
    } 
  } catch (e) {
    console.error('Error loading sessions:', e)
  }
}

// HTTP server setup
// SSL/TLS options
// const sslOptions = {
//   key: process.env.KEY, //fs.readFileSync(path.join('key.pem')),
//   cert: process.env.CERT, //fs.readFileSync(path.join('cert.pem')),
//   // Recommended security settings
//   secureOptions: constants.SSL_OP_NO_SSLv3 |
//               constants.SSL_OP_NO_TLSv1 |
//               constants.SSL_OP_NO_TLSv1_1
// }

const server = http.createServer(async (req, res) => {
  // Security headers
  // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  // res.setHeader('X-Content-Type-Options', 'nosniff')
  // res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  // res.setHeader('X-XSS-Protection', '1; mode=block')
  // res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Standard access to url
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>Welcome to the PeerPrep Collaboration Server</h1>')
  } 
  // POST request to create session
  else if (req.method === 'POST' && req.url === '/api/session') {
    handleCreateSession(req, res)
  } // POST request to termiante session
  else if (req.method === 'POST' && req.url === '/api/terminate') {
    handleTerminateSession(req, res)
    
  }
  // Unhandled requests
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('404 Not Found')
  }
})

async function handleCreateSession(req, res) {
  let body = []
  
  const timeout = setTimeout(() => {
    res.writeHead(408, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Request timeout' }))
    req.destroy()
  }, 30000)

  req.on('data', (chunk) => {
      body.push(chunk)
  })
  
  req.on('end', async () => {
    clearTimeout(timeout)
    try {
      await ensureDbConnected()

      const jsonBody = JSON.parse(Buffer.concat(body).toString())
      const user1 = jsonBody['user1']
      const user2 = jsonBody['user2']
      const session = jsonBody['sessionId']
      const question = jsonBody['questionId']
      const programmingLang = jsonBody['programmingLang']
      if (!user1 || !user2 || !session || !question || !programmingLang) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Bad request', time: new Date().toISOString() }))
        return
      } 
      const newSession = new Session(session, user1, user2, programmingLang, question, new Date())
      
      // Check valid user and question
      // Send req to question server to get parameters and function 
      // Fetch default template for language from mongoDb
      const [questionResult, templateResult, validUser1, validUser2] = await Promise.all([
        fetchQuestion(question, programmingLang),
        dbTemplates.findOne({ programmingLanguage: programmingLang }),
        validateUser(user1, newSession),
        validateUser(user2, newSession)])

      if (!questionResult.signature || !templateResult?.template || !validUser1 || !validUser2 || user1 === user2) {
        throw new Error("Invalid parameters")
      }

      const defaultContent = questionResult.definitions == '' ? templateResult.template.replace('<template function to go here>', questionResult.signature) : questionResult.definitions + '\n\n\n' + templateResult.template.replace('<template function to go here>', questionResult.signature)
      
      // Create a record in the db first with empty content
      await dbSessions.insertOne(newSession.getJsonified())
      
      // Add the new YDoc with default template to the session
      newSession.setYDoc(createYDoc(session, defaultContent))

      sessions.set(session, newSession)
      
      // Add session timeout and scheduled updater for db
      const sessionTimeout = setTimeout(() => endSession(newSession, "Session has ended due to inactivity"), number.parseInt(process.env.SESSION_TIMEOUT || '3600000'))
      const scheduledUpdater = setInterval(async () => {
        try {
          if (newSession.updated) {
            sessionTimeout.refresh()
            const [query, update] = newSession.getUpdateDocJsonsified()
            await dbSessions.updateOne(query, update, {upsert: false} )
            console.log(session, 'content updated')
            newSession.updated = false
          }
        } catch (e) {
          console.error('Error updating session', session, ':', e)
        }
      }, number.parseInt(process.env.SESSION_UPDATE || '60000'))
      newSession.scheduledUpdater = scheduledUpdater
      newSession.sessionTimeout = sessionTimeout
      
      console.log('New session created (', user1, ',', user2, '):', session)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }))
    
    } catch (e) {
      console.error(e)
      if (e instanceof MongoError && e.code === 11000) {
        res.writeHead(409, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Duplicate session', time: new Date().toISOString() }))
      } else if (e instanceof Error && e.message === "Invalid parameters") {
        res.writeHead(409, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Invalid parameters', time: new Date().toISOString() }))
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Internal Server Error', time: new Date().toISOString() }))
      }
    }
  })
}

async function handleTerminateSession(req, res) {
  let body = []

  const timeout = setTimeout(() => {
    res.writeHead(408, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Request timeout' }))
    req.destroy()
  }, 30000)

  req.on('data', (chunk) => {
      body.push(chunk)
  })

  req.on('end', async () => {
    clearTimeout(timeout)
    try {
      
      await ensureDbConnected()

      const jsonBody = JSON.parse(Buffer.concat(body).toString())
      const user = jsonBody['user']
      const sessionId = jsonBody['sessionId']
      if (!user || !sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Bad request', time: new Date().toISOString() }))
        return
      }

      const session = sessions.get(sessionId)
      // Check if valid user and valid user for session
      if (!session?.isValidUser(user)) {
        throw new Error('Invalid parameters')
      }

      const successfullyEnded = await endSession(session, "User has ended session")
      
      if (successfullyEnded) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }))
      } else {
        throw new Error('Failed to end session: ' + sessionId)
      }
      
    } catch (e) {
      console.error('Error terminating session:', e)

      if (e instanceof Error && e.message === "Invalid parameters") {
        res.writeHead(409, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Invalid parameters', time: new Date().toISOString() }))
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Internal Server Error', time: new Date().toISOString() }))
      }
    }
  })
}

// End a session
// Sends PUT requests to User service to update questions completed
// Marks the session as inactive and destroys relevant data 
async function endSession(session, reason) {
  console.log('Ending session:', session.sessionId)
  try {
    session.endSession(reason)
    // Send POST Request to User service
    const dataUser1 = {
      userId: session.user1,
      questionId: session.question
    }
    const dataUser2 = {
      userId: session.user2,
      questionId: session.question
    }
    const updateUser1Promise = fetch(userService + 'api/users/profile/add-completed-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataUser1)
    })

    const updateUser2Promise = fetch(userService + 'api/users/profile/add-completed-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataUser2)
    })

    // Mark the session as inactive in MongoDB
    const updateDbPromise = dbSessions.updateOne(
      { sessionId: session.sessionId },
      { $set: { 
            status: session.status, 
            updatedAt: new Date() 
        } },
      {upsert: false}
    )
    
    // Disconnect all chat websocket connections
    const conns = session.getAllChatConnections()
    const broadcastData = {
        type: 'ChatNotif',
        content: "Session has ended"
    }
    broadcastToConns(conns, broadcastData)
    conns.forEach(ws => {
      ws.close(3000, 'Session has ended')
      session.removeChatConnection("", ws)
    });


    const [updateUser1Result, updateUser2Result, updateDbResult] = await Promise.all([updateUser1Promise, updateUser2Promise, updateDbPromise])

    if (!updateUser1Result.ok) {
      const error = await updateUser1Result.text()
      throw new Error(`Failed to update user1: ${error}`)
    }
    if (!updateUser2Result.ok) {
      const error = await updateUser2Result.text()
      throw new Error(`Failed to update user2: ${error}`)
    }
    if (!updateDbResult.acknowledged) {
      throw new Error('Failed to update database')
    }

    // remove Session from Sessions map
    sessions.delete(session.sessionId)
    console.log('Successfully ended session:', session.sessionId)
    return true
  } catch (e) {
    console.error('Failed to end session', session.sessionId, ':', e)
    return false
  }
}

// Validate a user
async function validateUser(userId, session) {
  try {
    const response = await fetch(userService + 'api/users/check-id/' + userId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const res = await response.json()
    if (response.status === 200) {
      if (session.user1 === userId) {
        session.user1name = res.username
      } else if (session.user2 === userId) {
        session.user2name = res.username
      }
    }
    return response.status === 200
  } catch (e) {
    console.error('Error validating user', userId, ':', e)
    return false
  }
  
}

// Fetch question params and function given questionId and language
async function fetchQuestion(questionId, language) {
  const response = await fetch(questionService + 'questions/' + questionId + '/template?lang=' + language, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  return await response.json()
}

// Doc Websocket server setup
const docWss = new WebSocket.Server({ noServer: true, port: 8888 })

// When websocket tries to connect for doc
docWss.on('connection', setupWSConnection)

// Chat Websocket server setup
const chatWss = new WebSocket.Server({ noServer: true, port: 8889 })

// When websocket tries to connect for chat
chatWss.on('connection', async (ws, req) => {
  const parsedURL = new URL((process.env.SERVER_URL || '') + req.url)
  const sessionId = (parsedURL.pathname || '').slice(1)
  const userid = parsedURL.searchParams.get('userid') || ''

  // Get the session
  const session = sessions.get(sessionId)
  if (!session) {
    ws.close(4001, 'Session does not exist or has ended');
    return
  }
  let username
  if (session.user1 === userid) {
    username = session.user1name
  } else if (session.user2 === userid) {
    username = session.user2name
  }
  if (session.isUserChatDc(userid)) {
    const otherUserWs = session.getOtherUserConnections(userid)
    const broadcastData = {
        type: 'ChatNotif',
        content: username + " has joined the chat"
    }
    broadcastToConns(otherUserWs, broadcastData)
  }

  // Add ws connection to session
  session.addChatConnection(userid, ws)

  // Send success response 
  ws.send(JSON.stringify({
      type: 'JoinChat',
      status: 'Success',
      msg: 'User has joined the chat'
  }));

  ws.on('message', async (message) => {
    try {
      const data = message.toString()
      const parsedData = JSON.parse(data)
      if (parsedData.type === 'SendMsg') {
        const content = parsedData.content
        const broadcastData = {
            type: 'ChatMessage',
            username: username,
            content: content
        }
        const conns = session.getAllChatConnections()
        broadcastToConns(conns, broadcastData)
      }
    } catch (e) {
      console.log(`Caught error for`, sessionId)
      console.log(e)
    }
    
  })

  ws.on('close', () => {
    console.log('Client disconnected');
    if (session) {
      session.removeChatConnection(userid, ws);
      if (session.isUserChatDc(userid)) {
        const otherUserWs = session.getOtherUserConnections(userid)
        const broadcastData = {
            type: 'ChatNotif',
            content: username + " has left the chat"
        }
        broadcastToConns(otherUserWs, broadcastData)
      }
    }
  });
})

async function broadcastToConns(conns, data) {
  if (conns) {
    conns.forEach(ws => {
      if (ws !== null && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  } 
}

// Function to just call when socket has some error
function onSocketError(err) {
  console.error('Socket error:', err)
}

server.on('upgrade', async (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
  socket.on('error', onSocketError)

  const parsedURL = new URL((process.env.SERVER_URL || '') + request.url)
  const sessionId = (parsedURL.pathname || '').slice(1)
  const userid = parsedURL.searchParams.get('userid') || ''
  const purpose = parsedURL.searchParams.get('purpose') || ''

  if (sessions.get(sessionId)?.isValidUser(userid)) {
    socket.removeListener('error', onSocketError)
    if (purpose == 'doc') {
      docWss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
        docWss.emit('connection', ws, request)
        console.log(userid, 'joined', sessionId)
      })
    }
    else if (purpose == 'chat') {
      chatWss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
        chatWss.emit('connection', ws, request)
        console.log(userid, 'joined chat for ', sessionId)
      })
    }
  } else {
    console.log('Unauthorized access')
    console.log(parsedURL)
    socket.write('HTTP/1.1 401 Unauthorized\n\n')
    socket.emit('close')
    socket.destroy()
  }
})

const HOST = process.env.HOST || 'localhost'
const PORT = number.parseInt(process.env.PORT || '1234')

server.listen(PORT, () => {
  const interfaces = os.networkInterfaces()
  console.log(`Yjs WebSocket server running on port ${PORT}`)
  console.log(`Local: wss://localhost:${PORT}`)
  
  Object.keys(interfaces).forEach(ifname => {
    if (interfaces[ifname]) {
      interfaces[ifname].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Network: wss://${iface.address}:${PORT}`)
        }
      })
    }
  })

  loadActiveSessions()
})

// Shutdown server
process.on('SIGTERM', async () => {
  console.log('Shutting down server...')
  
  // Close WebSocket server
  docWss.close(() => {
    console.log('Doc WebSocket server closed')
  })

  chatWss.close(() => {
    console.log('Chat WebSocket server closed')
  })
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 30000)
})