class Session {
    constructor(sessionID, userId1, userId2, language, start) {
        this.sessionID = sessionID;
        this.user1 = userId1;
        this.user2 = userId2;
        this.language = language;
        this.startTime = start;
        this.endTime = new Date(this.startTime);
        this.endTime.setMinutes(this.startTime.getMinutes() + 60);
        this.websockets = new Set();
    }

    isValidUser(user) {
        if (this.user1 === user || this.user2 === user) {
            return true;
        }
        return false;
    }

    isStillActive() {
        return this.websockets.size !== 0;
    }

    addWebSocket(ws) {
        this.websockets.add(ws);
    }

    removeWebSocket(ws) {
        this.websockets.delete(ws);
    }

    getws() {
        return this.websockets;
    }
}

module.exports = Session;