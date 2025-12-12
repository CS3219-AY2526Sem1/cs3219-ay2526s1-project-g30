import { closeAllConn } from './utils.js'

export class Session {
    constructor(sessionId, userId1, userId2, language, question, start) {
        this.sessionId = sessionId
        this.user1 = userId1
        this.user2 = userId2
        this.user1name = ''
        this.user2name = ''
        this.language = language
        this.question = question
        this.startTime = start
        // this.endTime = new Date(this.startTime)
        // this.endTime.setMinutes(this.startTime.getMinutes() + 60)
        this.status = 'Active'
        this.updated = true
        this.scheduledUpdater = null // To be destroyed when session is destroyed
        this.sessionTimeout = null
        this.user1Connections = new Set()
        this.user2Connections = new Set()
    }

    isValidUser(user) {
        if (this.user1 === user || this.user2 === user) {
            return true
        }
        return false
    }

    setYDoc(doc) {
        this.yDoc = doc
    }

    getYDoc() {
        return this.yDoc
    }

    addChatConnection(userId, ws) {
        if (userId === this.user1) {
            this.user1Connections.add(ws)
        } else if (userId === this.user2) {
            this.user2Connections.add(ws)
        }
    }

    removeChatConnection(userId, ws) {
        if (userId === this.user1) {
            this.user1Connections.delete(ws)
        } else if (userId === this.user2) {
            this.user2Connections.delete(ws)
        } else if (userId === "") {
            this.user1Connections.delete(ws)
            this.user2Connections.delete(ws)
        }
    }

    isUserChatDc(userId) {
        if (userId === this.user1) {
            return this.user1Connections.size == 0
        }
       if (userId === this.user2) {
            return this.user2Connections.size == 0
        }
    }

    getOtherUserConnections(userId) {
        if (userId === this.user1) {
            return this.user2Connections
        } else if (userId === this.user2) {
            return this.user1Connections
        }
    }

    getAllChatConnections() {
        const allConns = new Set(this.user1Connections);

        this.user2Connections.forEach(ws => {
            allConns.add(ws);
        });

        return allConns;
    }

    getJsonified() {
        let content = ''
        if (this.yDoc) {
            content = this.yDoc.getText('monaco').toString()
        } 
        const jsonified = {
            sessionId: this.sessionId,
            user1: this.user1,
            user2: this.user2,
            language: this.language,
            question: this.question,
            status: this.status,
            startTime: this.startTime,
            content: content,
            updatedAt: this.startTime  
        }
        return jsonified
    }
    
    getUpdateDocJsonsified() {
        const query = { sessionId: this.sessionId }
        const update = { 
            $set: { 
                content: this.yDoc.getText('monaco').toString(), 
                updatedAt: new Date() 
            } 
        }
        return [query, update]
    }

    endSession(reason) {
        closeAllConn(this.yDoc, 3000, reason)
        this.yDoc.destroy()
        clearInterval(this.scheduledUpdater)
        clearTimeout(this.sessionTimeout)
        this.status = 'Inactive'
    }
}
