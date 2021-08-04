const connect = require("connect"),
    vhost = require("vhost"),
    https = require("https"),
    http = require("http"),
    webSocket = require("ws"),
    fs = require("fs"),
    Static = require("./static"),
    Api = require("./api"),
    dbquery = require("./db"),
    Socket = require("./socket.js"),
    socketApi = require("./socketApi.js");

const api = new Api(dbquery);
const static = new Static();

const app = connect();

// call api if path is /api or if useapi-header is set (direct access for app), else serve static filess
app.use(vhost(new RegExp(".*"), (req, res) => {
    try {
        if (/.*(?:\/api\/).*/gm.test(req.url) || req.headers.useapi) api.handleRequest(req, res);
        else static.handleRequest(req, res);
    } catch (e) {
        console.error("uncaught error:", e);
        res.end("500 - server error");
    }
}));

const httpsServer = https.createServer({
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
}, app).listen(process.env.HTTPS_PORT);

const httpServer = http.createServer(app).listen(process.env.HTTP_PORT);

const webSocketServer = new webSocket.Server({
    port: process.env.WEBSOCKET_PORT
});

webSocketServer.on("connection", s => {
    let socket = new Socket(s);
    socket.send({
        "trigger": "welcome"
    });
    socket.on("message", (data) => {
        socketApi(data, socket, api)
    });
});

process.on('SIGTERM', async () => {
    let servers = [httpsServer, httpServer, webSocketServer];
    for (let server of servers) {
        await new Promise((resolve, _reject) => {
            console.log("terminating server...");
            server.close(() => {
                resolve(true);
            });
        });
    }
    process.exit(0);
});