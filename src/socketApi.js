const dateformat = require("dateformat");

const socketApi = async (data, socket, api) => {
    let message = JSON.parse(data);
    switch (message.action) {
        case "listen":
            while (socket.isConnected) {
                let messageData = await api.waitForMessage(message.data, dateformat(new Date(), "yyyy-mm-dd HH:MM:ss.l"));
                socket.send({
                    trigger: "newmessage",
                    data: messageData
                });
            }
            break;
        case "listenChatKey":
            while(socket.isConnected){
                let newContent = await api.waitForChatKey(message.data.username);
                socket.send({
                    trigger:"newChatKey",
                    data: newContent
                });
            }
            break;
        default:
            socket.send({
                err: "unknown action"
            });
    }
}

module.exports = socketApi;