import { closeAllConn } from './utils.js'

export class Session {
    constructor(sessionId, userId1, userId2, language, question, start) {
        this.sessionId = sessionId
        this.user1 = userId1
        this.user2 = userId2
        this.language = language
        this.question = question
        this.startTime = start
        this.endTime = new Date(this.startTime)
        this.endTime.setMinutes(this.startTime.getMinutes() + 60)
        this.status = 'Active'
        this.updated = true
        this.scheduledUpdater = null // To be destroyed when session is destroyed
        this.sessionTimeout = null
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
