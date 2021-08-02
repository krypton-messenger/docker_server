const mysql = require("mysql2"),
    cron = require("./cron");

const databasePool = mysql.createPool({
    connectionLimit: 200,
    host: process.env.DB_HOST,
    user: process.env.DB_USER.split("@").shift(),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

setInterval(() => {
    cron(module.exports);
}, 300000); // every 5 minutes (5*60*1000)

module.exports = (q, fill) => {
    return new Promise(function (resolve, reject) {
        // get a connection from the pool
        databasePool.getConnection((err, connection) => {
            if (err) {
                console.log("connection to database failed: " + err.code);
                setTimeout(() => {
                    console.log("retrying...");
                    module.exports(q, fill).then(resolve);
                }, 1500);
                return;
            }
            // Use the connection
            connection.query(q, fill ?? [], function (err, result, x) {
                // release the connection
                connection.release();
                if (err) reject(err);
                resolve(result);
            });

        });
    });
}