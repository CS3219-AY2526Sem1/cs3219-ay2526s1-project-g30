#!/usr/bin/env node
import dotenv from 'dotenv'
import WebSocket from 'ws'
import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import os from 'os'
import * as number from 'lib0/number.js'
import { Session } from './session.js'
import { constants } from 'crypto'
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

// Connect to MongoDB
MongoClient.connect(mongoOnlineUrl, {
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
.then(async () => {
  // Load active sessions from MongoDB on server start
  const findResult = await dbSessions.find({ status: 'Active' })
  for await (const storedSession of findResult) {
    const newSession = new Session(storedSession.sessionId, storedSession.user1, storedSession.user2,
      storedSession.language, storedSession.question, storedSession.startTime)
    newSession.setYDoc(createYDoc(storedSession.sessionId, storedSession.content))
    console.log('Stored session retrieved (', storedSession.user1, ',', storedSession.user2, '):', storedSession.sessionId)
    sessions.set(storedSession.sessionId, newSession)
    const sessionTimeout = setTimeout(() => endSession(newSession, "Session has ended due to inactivity"), number.parseInt(process.env.SESSION_TIMEOUT || '3600000'))
    const scheduledUpdater = setInterval(async () => {
      if (newSession.updated) {
        sessionTimeout.refresh()
        const queryupdate = newSession.getUpdateDocJsonsified()
        await dbSessions.updateOne(queryupdate[0], queryupdate[1], {upsert: false} )
        console.log(storedSession.sessionId, 'content updated')
      }
    }, number.parseInt(process.env.SESSION_UPDATE || '60000'))
    newSession.scheduledUpdater = scheduledUpdater
    newSession.sessionTimeout = sessionTimeout
  }
})


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

const server = http.createServer((req, res) => {
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
    // This is a POST request
    let body = []
    req.on('data', (chunk) => {
        body.push(chunk)
    })
    req.on('end', async () => {
      try {
        if (!dbSessions) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          if (!dbSessions) {
            throw new Error("DB has not been connected")
          }
        }
        const jsonBody = JSON.parse(Buffer.concat(body).toString())
        const user1 = jsonBody['user1']
        const user2 = jsonBody['user2']
        const session = jsonBody['sessionId']
        const question = jsonBody['questionId']
        const programmingLang = jsonBody['programmingLang']
        if (!user1 || !user2 || !session || !question || !programmingLang) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ status: 'Bad request', time: new Date().toISOString() }))
        } else {
          const newSession = new Session(session, user1, user2, programmingLang, question, new Date())
          
          // Check valid user and question
          const valU1Promise = validateUser(user1)
          const valU2Promise = validateUser(user2)
          // Send req to question server to get parameters and function 
          const questionPromise = fetchQuestion(question, programmingLang)
          // Fetch default template for language from mongoDb
          const templatePromise = dbTemplates.findOne({ programmingLanguage: programmingLang })
          const [questionResult, templateResult, validUser1, validUser2] = await Promise.all([questionPromise, templatePromise, valU1Promise, valU2Promise]);
          if (!questionResult.signature || !templateResult.template || !validUser1 || !validUser2 || user1 === user2) {
            throw new Error("Invalid parameters")
          }

          const defaultContent = questionResult.definitions + '\n\n\n' + templateResult.template.replace('<template function to go here>', questionResult.signature)
          
          // Create a record in the db first with empty content
          const ret = await dbSessions.insertOne(newSession.getJsonified())
          
          // Add the new YDoc with default template to the session
          newSession.setYDoc(createYDoc(session, defaultContent))

          console.log('New session created (', user1, ',', user2, '):', session)
          sessions.set(session, newSession)
          
          // Add session timeout and scheduled updater for db
          const sessionTimeout = setTimeout(() => endSession(newSession, "Session has ended due to inactivity"), number.parseInt(process.env.SESSION_TIMEOUT || '3600000'))
          const scheduledUpdater = setInterval(async () => {
            if (newSession.updated) {
              sessionTimeout.refresh()
              const [query, update] = newSession.getUpdateDocJsonsified()
              await dbSessions.updateOne(query, update, {upsert: false} )
              console.log(session, 'content updated')
            }
          }, number.parseInt(process.env.SESSION_UPDATE || '60000'))
          newSession.scheduledUpdater = scheduledUpdater
          newSession.sessionTimeout = sessionTimeout
          
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }))
        }
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
  } else if (req.method === 'POST' && req.url === '/api/terminate') {
    let body = []
    req.on('data', (chunk) => {
        body.push(chunk)
    })
    req.on('end', async () => {
      try {
        if (!dbSessions) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          if (!dbSessions) {
            throw new Error("DB has not been connected")
          }
        }
        const jsonBody = JSON.parse(Buffer.concat(body).toString())
        const user = jsonBody['user']
        const sessionId = jsonBody['sessionId']
        if (!user || !sessionId) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ status: 'Bad request', time: new Date().toISOString() }))
        } else {
          
          // Check if valid user and valid user for session
          validateUser(user)
          if (!sessions.has(sessionId) || !sessions.get(sessionId)?.isValidUser(user)) {
            throw new Error('Invalid parameters')
          }
          const successfullyEnded = await endSession(sessions.get(sessionId), "User has ended session")
          if (successfullyEnded) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }))
          } else {
            throw new Error('Failed to end session: ' + sessionId)
          }
        }
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
  // Unhandled requests
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('404 Not Found')
  }
})

// Websocket server setup
const wss = new WebSocket.Server({ noServer: true })

// When websocket tries to connect
wss.on('connection', setupWSConnection)

// Function to just call when socket has some error
function onSocketError(err) {
  console.error(err)
}

server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
  socket.on('error', onSocketError)

  const parsedURL = new URL((process.env.SERVER_URL || '') + request.url)
  const sessionId = (parsedURL.pathname || '').slice(1)
  const userid = parsedURL.searchParams.get('userid') || ''

  if (sessions.has(sessionId) && sessions.get(sessionId)?.isValidUser(userid)) {
    socket.removeListener('error', onSocketError)
    wss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
      wss.emit('connection', ws, request)
      console.log(userid, 'joined', sessionId)
    })
  } else {
    console.log('Unauthorized access')
    console.log(parsedURL)
    socket.write('HTTP/1.1 401 Unauthorized\n\n')
    socket.emit('close')
    socket.destroy()
  }
})

// End a session
// Sends PUT requests to User service to update questions completed
// Marks the session as inactive and destroys relevant data 
async function endSession(session, reason) {
  console.log('Ending session:', session.sessionId)
  try {
    session.endSession(reason)
    // Send PUT Request to User service

    // Mark the session as inactive in MongoDB
    await dbSessions.updateOne(
      { sessionId: session.sessionId },
      { $set: { 
            status: session.status, 
            updatedAt: new Date() 
        } },
      {upsert: false}
    )
    
    // remove Session from Sessions map
    sessions.delete(session.sessionId)
    console.log('Successfully ended session:', session.sessionId)
    return true
  } catch (e) {
    console.log('Failed to end session:', session.sessionId)
    console.error(e)
    return false
  }
}

async function validateUser(userId) {
  const response = await fetch(userService + 'api/users/' + userId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  console.log(response)
  try {
    const data = await response.json();
    // console.log(data)
    // Check datas to see if valid
    return data._id
  }
  catch (e) {
    console.error(e)
    return false
  }
}

async function fetchQuestion(questionId, language) {
  const response = await fetch(questionService + 'questions/' + questionId + '/template?lang=' + language, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  const data = await response.json();
  // console.log(data)
  return data
}

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
})