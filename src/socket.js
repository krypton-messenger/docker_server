const WebSocket = require("ws");
class Socket {
    constructor(socketConnection) {
        this.client = socketConnection;
    }
    get isConnected(){
        return this.client.readyState == WebSocket.OPEN;
    }
    send(data) {
        if(this.isConnected) return this.client.send(JSON.stringify(data));
        else return false;
    }
    on(event, listener) {
        return this.client.on(event, listener);
    }
}

module.exports = Socket;