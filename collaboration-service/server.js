const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Session = require('./Session');
const { MongoClient } = require('mongodb');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const timeoutMin = 15;
const ipAddress = '192.168.45.130';

// MongoDB setup
// const mongoLocalUrl = 'mongodb://localhost:27017';
const mongoOnlineUrl = process.env.MONGO_DB_URL;
const dbSessionName = 'session_storage';
const dbTemplateName = 'default_templates';
let db, dbSessions, dbTemplates;

// Connect to MongoDB
MongoClient.connect(mongoOnlineUrl)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbSessionName);
    dbSessions = db.collection('sessions');
    dbTemplates = client.db(dbTemplateName).collection('templates');
    setInterval(() => {
        closeInactiveSessionsInDb();
    }, 1000 * 60);
})
.catch(err => console.error('MongoDB connection error:', err));

// Serve static files
app.use(express.static('public'));
app.use(express.json())

// Store connected clients by session
const activeSessions = new Map();

// Create session
app.post('/createSession', async function
    (req, res) {
        try {
            console.log(req.body);
            const user1 = req.body.user1;
            const user2 = req.body.user2;
            const session = req.body.sessionId;
            const language = req.body.language;
            const question = req.body.question;
            const startTime = new Date();
            // const defaultContent = await dbTemplates.findOne({language: language});

            // Change content to defaultContent after adding default templates to the db
            const doc = {
                sessionId: session,
                user1: user1,
                user2: user2,
                language: language,
                question: question,
                status: 'Active',
                startTime: startTime,
                content: 'Java starting languge code:',
                updatedAt: startTime  
            }

            const ret = await dbSessions.insertOne(doc);

            activeSessions.set(session, new Session(session, user1, user2, language, startTime));

            // Set session timeout
            setTimeout(() => {
                console.log(`Attempting to close ${session}`);
                closeSession(session);
            }, 1000 * 60 * timeoutMin);

            res.status(201).send({
                status: 'Success'
            });
        } catch (e) {
            console.log(e);
            if (e.code === 11000) {
                res.status(400).send({
                    err: "Session already exists"
                });
            } else {
                res.status(400).send({
                    err: e
                });
            }
            
        }
});


// Web Socket Connection
wss.on('connection', (ws) => {
  console.log('New client attempting to connect');
  let clientSession = null;
  let authenticated = false;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log(data);
      console.log(message);
      
      // Initialization of the web socket when user "Joins" the session
      if (data.type === 'join') {
        clientSession = data.sessionId;
        
        // Check if session exists in current load of active sessions
        if (!activeSessions.has(clientSession)) {
            // Check if sessionid exists in the database. Else close the web socket
            if ((await dbSessions.countDocuments({sessionId: clientSession})) !== 0) {
                // Check if session is in db and active
                const doc = await dbSessions.findOne({sessionId: clientSession});
                // If active add the session to the current load of sessions. Else close the web socket
                if (doc.status !== 'Active') {
                    clientSession = null;
                    ws.send(JSON.stringify({
                        type: 'Error',
                        status: 'Error',
                        msg: 'Expired session'
                    }));
                    ws.close(3000, 'Expired');
                }
                else {
                    let d = new Date();
                    d.setMinutes(d.getMinutes() - timeoutMin);
                    if (doc.startTime < d) {
                        ws.send(JSON.stringify({
                            type: 'Error',
                            status: 'Error',
                            msg: 'Expired session'
                        }));
                        closeSession(clientSession);
                        clientSession = null;
                        ws.close(3000, 'Expired');
                    } else {
                        let endTime = new Date(doc.startTime);
                        endTime.setMinutes(endTime.getMinutes() + timeoutMin);
                        const timeLeft = Math.abs(endTime - new Date());
                        setTimeout(() => {
                            console.log(`Attempting to close ${clientSession}`);
                            closeSession(clientSession);
                        }, timeLeft);
                        activeSessions.set(clientSession, new Session(doc.sessionId, doc.user1, doc.user2, doc.language, doc.startTime));
                    }
                }
            }
            else {
                clientSession = null;
                ws.send(JSON.stringify({
                    type: 'Error',
                    status: 'Error',
                    msg: 'Invalid session id'
                }));
                ws.close(3000, 'Invalid');
            }
        }
        // Ensure that session exists in the current load of active sessions
        if (clientSession && activeSessions.has(clientSession)) {
            const currSession = activeSessions.get(clientSession);
            // Validate that it is the correct user trying to access the session
            if (currSession.isValidUser(data.userId)) {
                const doc = await dbSessions.findOne({sessionId: clientSession});
                // Correct user trying to set up web socket with a valid session
                authenticated = true;
                // Add websocket to session for further broadcasting
                currSession.addWebSocket(ws);

                // Send success response
                ws.send(JSON.stringify({
                    type: 'JoinSession',
                    status: 'Success',
                    msg: 'User has joined collaborative coding session'
                }));
                
                // Send initialization response for the base code
                ws.send(JSON.stringify({
                    type: 'init',
                    content: doc ? doc.content : '',
                    sessionId: clientSession
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'Error',
                    status: 'Error',
                    msg: 'User authentication failed for session'
                }));
                ws.close(3000, 'Wrong User');
            }
        } else {
            ws.send(JSON.stringify({
                type: 'Error',
                status: 'Error',
                msg: 'An unknown error occurred'
            }));
            ws.close(3000, 'Unknown')
        }
        
        // If want to see other user in the session
        // const userCount = sessions.get(clientSession).size;
        // broadcastToSession(clientSession, {
        //   type: 'users',
        //   count: userCount
        // });
      }
      
      // When user updates the code update the db and broadcast to users in the session
      if (data.type === 'update' && clientSession && authenticated) {
        // Save to MongoDB
        // console.log("Saved to db");
        // await dbSessions.updateOne(
        //   { sessionId: clientSession },
        //   { 
        //     $set: { 
        //       content: data.content, 
        //       updatedAt: new Date() 
        //     } 
        //   }
        // );

        // Broadcast to other user in the same session
        // !!!!!!!!!! LOOK INTO IF I SHOULD BROADCAST TO BOTH USERS OR JUST THE ONE THAT DID NOT MAKE THE UPDATE !!!!!!!!!!!!!!!!!!!!!!!
        // !!!!!!!!!! LOOK INTO HOW REAL TIME THIS IS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // const broadcastData = {
        //     type: 'update',
        //     content: data.content
        // };
        // broadcastToSession(activeSessions.get(clientSession), broadcastData);
        const sessionClients = activeSessions.get(clientSession).getws();
        if (sessionClients) {
          sessionClients.forEach(client => {
            if (client !== null && client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'update',
                content: data.content
              }));
              console.log(`sent to user at ${new Date()}`);
            }
          });
        }
      }

      // When user requests to leave the session
      if (data.type === 'leave' && clientSession && authenticated) {
        if (activeSessions.has(clientSession)) {
          activeSessions.get(clientSession).removeWebSocket(ws);
        //   if (!activeSessions.get(clientSession).isStillActive()) {
        //     await dbSessions.updateOne(
        //         { sessionId: clientSession },
        //         { 
        //             $set: { 
        //             status: 'Inactive', 
        //             updatedAt: new Date() 
        //             } 
        //         }
        //     );
        //     activeSessions.delete(clientSession);
        //   }
          console.log(`Client left session: ${clientSession}`);
          authenticated = false;
          clientSession = null;
          ws.close(4000, 'Leave session');
        } else {
            ws.close(3000, 'Unexpected leave request');
        }
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  // When websocket closes (can be intential or unintentional)
  ws.on('close', () => {
    console.log('Client disconnected');
    
    if (clientSession && activeSessions.has(clientSession)) {
      activeSessions.get(clientSession).removeWebSocket(ws);
      
    //   // Clean up empty sessions
    //   if (sessions.get(clientSession).size === 0) {
    //     sessions.delete(clientSession);
    //   } else {
    //     // Notify remaining users
    //     const userCount = sessions.get(clientSession).size;
    //     broadcastToSession(clientSession, {
    //       type: 'users',
    //       count: userCount
    //     });
    //   }
    }
  });
});



// Look for inactive sessions in the db and close it
async function closeInactiveSessionsInDb() {
    try {
        const sessionOverDate = new Date(Date.now() - timeoutMin * 60 * 1000);
        const result = await dbSessions.updateMany(
            { 
                status: 'Active',
                startTime: { $lt: sessionOverDate }
            },
            { 
                $set: { 
                status: 'Inactive',
                updatedAt: new Date()
                } 
            }
        );
    } catch (e) {
        console.log(`An error occurred while trying to clean up db`);
        console.log(e);
    }
}

// Close specific session
async function closeSession(sessionId) {
    if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        const broadcastData = {
            type: 'SessionEnd',
            content: "Session has ended"
        }
        broadcastToSession(session, broadcastData);
        activeSessions.delete(sessionId);
        const sessionClients = session.getws();
        if (sessionClients) {
            sessionClients.forEach(ws => {
            if (ws !== null && ws.readyState === WebSocket.OPEN) {
                ws.close(4000, 'Session has ended');
            }
            });
        }
    }
    try {
        await dbSessions.updateOne(
            { sessionId: sessionId },
            { 
                $set: { 
                status: 'Inactive', 
                updatedAt: new Date() 
                } 
            }
        );
        console.log(`Successfully closed ${sessionId}`);
    } catch (e) {
        console.log(`An error occurred while trying to close ${sessionId}`);
        console.log(e);
    }  
}

// Broadcast message to a given session
function broadcastToSession(session, data) {
  const sessionClients = session.getws();
  if (sessionClients) {
    sessionClients.forEach(ws => {
      if (ws !== null && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }
}

const PORT = process.env.PORT || 3000;

// Get local IP address
const os = require('os');
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`\nServer running on port ${PORT}`);
  console.log(`Local network access: http://${localIP}:${PORT}`);
  console.log(`Localhost access: http://localhost:${PORT}`);
});