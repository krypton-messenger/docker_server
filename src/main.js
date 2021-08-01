const connect = require("connect"),
    vhost = require("vhost"),
    mysql = require("mysql2"),
    https = require('https'),
    http = require('http'),
    websocket = require("ws"),
    fs = require("fs");

new websocket.Server({
    port: process.env.WEBSOCKET_PORT
});

const databasePool = mysql.createPool({
    connectionLimit: 200,
    host: process.env.DB_HOST,
    user: process.env.DB_USER.split("@").shift(),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

var app = connect();

app.use(vhost(new RegExp('.*'), (_req, res) => {
    res.end("hello world");
}));

https.createServer({
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
}, app).listen(process.env.HTTPS_PORT);

http.createServer(app).listen(process.env.HTTP_PORT);