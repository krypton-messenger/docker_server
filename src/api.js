const querystring = require("qs"),
    forge = require("node-forge"),
    sharp = require("sharp"),
    dateformat = require("dateformat"),
    fs = require("fs"),
    fp = require("fs.realpath"),
    bcrypt = require("bcrypt"),
    errorCodes = require("./errorCodes");


class Api {
    constructor(dbquery) {
        this.dbquery = dbquery;
        this.messageListeners = {};
        this.chatKeyListeners = {}
    }

    sleep(duration) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, duration);
        });
    }

    async handleRequest(req, res) {
        console.log("api:", req.url);

        this.sendHeaders(req, res);
        let params = await this.getParameters(req)
        params.action = this.getAction(req.url);

        let auth = req.headers.authorization;

        var response = {};
        try {
            res.statusCode = 200;
            response = await this.callApi(params, auth);
        } catch (error) {
            if (error._catchPassThru) {
                response = error;
                response._catchPassThru = undefined;
            } else {
                res.statusCode = 500;
                response = {
                    error: {
                        code: "0x0003",
                        description: "Server error"
                    }
                };
                console.error("SERVER_ERROR:", error)
            }
        }
        // console.log({
        //     params,
        //     auth,
        //     response
        // });
        res.write(JSON.stringify(response, null, 3));
        res.end();
    }

    getParameters(req) {
        if (req.method == "POST") return new Promise((resolve, reject) => {
            var body = '';
            req.on('data', function (data) {
                body += data;
                // Too much POST data, kill the connection
                if (body.length > process.env.MAX_POST_SIZE) {
                    req.connection.destroy();
                    reject("too much data");
                }
            });
            req.on('end', function () {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(querystring.parse(body));
                }
            });
        });
        else return new Promise((resolve, _reject) => {
            resolve(Object.fromEntries(new URLSearchParams(req.url.split("?").pop()).entries()));
        })
    }

    getAction(url) {
        return /(?<action>(?<=^.*\/)[a-zA-Z]*(?=\?|$))/gm.exec(url).groups.action;
    }

    sendHeaders(_req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader("X-Powered-By", "ttschnz");
    }

    returnError(errorCode, suffix) {
        return {
            // if _catchPassThru is true, the code will return the error to the user
            _catchPassThru: true,
            success: false,
            error: {
                code: errorCode,
                description: errorCodes[errorCode] + (suffix ?? "")
            }
        };
    }

    checkParameter(query, key) {
        if (query[key] == "") throw this.returnError("0x0019", ": " + key);
        if (query[key] == undefined) throw this.returnError("0x0018", ": " + key);
        return query[key];
    }

    async authorize(query, authToken) {
        let username = this.checkParameter(query, "username");
        if (!authToken) throw this.returnError("0x001a");
        let token = authToken.replace("Bearer ", "");
        if (!await this.verifyToken(username, token)) throw this.returnError("0x001b");
        return true;
    }

    async verifyToken(username, token) {
        return (await this.dbquery("SELECT COUNT(`username`) AS 'count' FROM `authorisation` WHERE `token`=? AND `username` = ?", [token, username]))[0].count > 0;
    }

    requiresAuthentication(actionName) {
        return ["knock", "setprofilepicture", "updatechatkeys", "getchatkeys", "getchatkeyinbox", "getchatkeysinbox", "removechatkey", "removechatkeys", "awaitinbox", "updatechatkeyinbox", "awaitchatkeyinbox"].indexOf(actionName.toLowerCase()) >= 0;
    }

    waitForMessage(chatids, starttime) {
        return new Promise(async (resolve, _reject) => {
            if (process.env.API_STANDALONE) {
                for (let chatid of chatids) {
                    this.messageListeners[chatid] = this.messageListeners[chatid] ?? []
                    this.messageListeners[chatid].push({
                        callback: resolve,
                        starttime
                    });
                }
            } else {
                do {
                    data = await this.dbquery("SELECT * FROM `messages` WHERE FIND_IN_SET(`chat_id`, ?) AND `timestamp`<=current_timestamp() AND `timestamp`>=?;", [chatids, starttime]);
                } while (data.length == 0 && await this.sleep(200));
                resolve(data);
            }
        });
    }

    waitForChatKey(username){
        return new Promise(async (resolve,_reject)=>{
            if(process.env.API_STANDALONE){
                this.chatKeyListeners[username] = this.chatKeyListeners[username] ?? [];
                this.chatKeyListeners[username].push({
                    callback: resolve
                });
            }
        })
    }

    async resolveChatKey(username, content){
        for(let entry of this.chatKeyListeners[username] ?? []){
            try{
                entry.callback(content);
            }catch(e){
                console.error(`error resolving chatKeyListener ${username}`, e);
            }
        }
    }
    async resolveChatIds(chatid, messageData) {
        for (let entry of this.messageListeners[chatid] ?? []) {
            try {
                entry.callback(messageData);
            } catch (e) {
                console.error(`error resolving chatid ${chatid}:`, e);
            }
        }
    }
    validateKeyset(privateKey, publicKey) {
        var valid = true;
        try {
            valid = forge.pem.decode(privateKey)[0].type == "RSA PRIVATE KEY" && forge.pem.decode(publicKey)[0].type == "RSA PUBLIC KEY";
        } catch (e) {
            valid = false;
        }
        return valid;
    }
    async userExists(username) {
        let dbresult = await this.dbquery("SELECT COUNT(`username`) AS 'count' FROM `users` WHERE `username`=?;", [username]);
        return dbresult[0].count == 1;
    }

    async reserveLicence(licence, username) {
        let dbresult = await this.dbquery("UPDATE `licences` SET `used` = '1', `username` = ? WHERE `licences`.`code` = ? AND `used` = 0", [username, licence]);
        return dbresult.affectedRows == 1;
    }

    async verifyPassword(password, username) {
        return new Promise(async (resolve, reject) => {

            // get hash from db
            var dbresult = await this.dbquery("SELECT `password` FROM `users` WHERE `username` = ?;", [username]);
            var hash = dbresult[0].password;

            // compare it to password
            bcrypt.compare(password, hash, function (err, result) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result == true);
            })

        })
    }

    scaleImage(data, w, h) {
        return new Promise((resolve, _reject) => {
            var dataSet = data.split(';base64,');
            sharp(Buffer.from(dataSet.pop(), 'base64'))
                .resize(w ?? 300, h ?? 300)
                .toBuffer()
                .then(data => {
                    resolve(dataSet.pop() + ';base64,' + data.toString('base64'));
                });
        });
    }

    writeFile(content, fileName) {
        return new Promise((resolve, _reject) => {
            var fileLocation = process.env.FILE_DIR + "/" + fileName + process.env.FILE_EXTENSION;
            fs.writeFile(fileLocation, content, (err) => {
                if (err) throw this.returnError("0x000c");
                resolve(true);
            });
        });
    }

    readFile(fileName) {
        return new Promise((resolve, _reject) => {
            var fileLocation = process.env.FILE_DIR + "/" + fileName + process.env.FILE_EXTENSION;
            var rp = "";
            var err = false;
            try {
                rp = fp.realpathSync(fileLocation);
            } catch (e) {
                rp = e.path;
                err = true;
            }

            if (rp.split(process.env.FILE_DIR)[0] != "") throw this.returnError("0x000a");
            if (err) throw this.returnError("0x000b");

            fs.readFile(fileLocation, "utf-8", (err, data) => {
                if (err) throw this.returnError("0x000b");
                resolve(data);
            });
        });
    }
    hashPassword(password, saltRounds) {
        return new Promise(async (resolve, reject) => {
            if (!password) {
                reject("password undefined");
                return;
            }
            bcrypt.hash(password, saltRounds ?? 12, function (err, hash) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(hash);
                }

            );
        });
    }
    callApi(query, authToken, socket) {
        var response = {};
        socket = socket ?? false;
        return new Promise(async (resolve, reject) => {
            try {
                if (this.requiresAuthentication(query.action) && !socket) await this.authorize(query, authToken);
                response.success = false;
                switch (query.action.toLowerCase()) {
                    case null:
                        response = this.returnError("0x0000");
                        break;

                    case "serverinformation":
                        response.success = true;
                        console.log(getServerInfo);
                        response.data = await getServerInfo();
                        break;

                    case "createuser":
                    case "createaccount":

                        // clients username
                        var username = this.checkParameter(query, "username");

                        // clients password
                        var password = this.checkParameter(query, "password");

                        // check if password could be a sha-512 => 64bytes = 128hex
                        if (password.length != 128) {
                            throw this.returnError("0x000f", ": length is " + password.length);
                        }

                        var hashedPassword = await this.hashPassword(password);

                        var privateKey = this.checkParameter(query, "privateKey");
                        var publicKey = this.checkParameter(query, "publicKey");

                        // check if keys are real
                        if (!this.validateKeyset(privateKey, publicKey)) {
                            response = this.returnError("0x0017");
                            resolve(response);
                            return;
                        }

                        // check if user does not already exist
                        if (await this.userExists(username)) {
                            response = this.returnError("0x0012");
                            resolve(response);
                            return;
                        }

                        // check if the licence is valid if it is set to use licences
                        if (process.env.USE_LICENCES) {
                            var licence = this.checkParameter(query, "licenceKey");
                            if (!await this.reserveLicence(licence, username)) {
                                response = this.returnError("0x0010");
                                resolve(response);
                                return;
                            }
                        }

                        // the data is all right, create a user
                        var dbresult = await this.dbquery("INSERT INTO `users`(`username`, `password`, `privateKey`, `publicKey`, `chatKeysInbox`) VALUES (?, ?, ?, ?, '[]');", [username, hashedPassword, privateKey, publicKey]);
                        response.success = dbresult.affectedRows == 1;
                        break;

                    case "authenticate":
                    case "authorize":
                    case "auth":
                        // get username
                        var username = this.checkParameter(query, "username");
                        if (!await this.userExists(username)) throw this.returnError("0x0013");

                        // get password
                        var password = this.checkParameter(query, "password");

                        if (!await this.verifyPassword(password, username)) throw this.returnError("0x0016");

                        var token = forge.util.bytesToHex(forge.random.getBytes(process.env.AUTH_KEY_LENGTH));
                        var dbresult = await this.dbquery("INSERT INTO `authorisation` (`username`, `token`, `expires`) VALUES (?, ?, now()+ interval ? second);", [username, token, process.env.AUTH_KEY_DURATION]);
                        response.success = dbresult.affectedRows == 1;
                        var privateKey = (await this.dbquery("SELECT `privateKey` FROM `users` WHERE `username` = ?;", [username]))[0].privateKey;

                        response.data = {
                            token: token,
                            expires: process.env.AUTH_KEY_DURATION,
                            privateKey: privateKey
                        }
                        break;

                    case "knock":
                        if (await this.authorize(query, authToken)) response.success = true;
                        break;

                    case "search":
                        var searchedUser = this.checkParameter(query, "user");
                        var searchResults = (await this.dbquery("SELECT `username` FROM `users` WHERE `username` LIKE ? LIMIT 20;", ["%" + searchedUser + "%"]));
                        response.success = true;
                        response.data = [];
                        for (var i of searchResults) {
                            response.data.push(i.username);
                        }
                        break;

                    case "getprofilepicture":
                        var username = this.checkParameter(query, "user");
                        if (!await this.userExists(username)) throw this.returnError("0x0013");
                        var profilePicture = (await this.dbquery("SELECT `profilePicture` FROM `users` WHERE `username` LIKE ?;", [username]))[0].profilePicture;
                        response["data"] = profilePicture;
                        break;

                    case "setprofilepicture":
                        var username = this.checkParameter(query, "username");
                        var originalProfilePicture = this.checkParameter(query, "profilePictureURI");
                        var data = await this.scaleImage(originalProfilePicture);
                        var dbresult = await this.dbquery("UPDATE `users` SET `profilePicture` = ? WHERE `users`.`username` = ?;", [data, username]);
                        response.success = dbresult.affectedRows == 1;
                        break;

                    case "getpublickey":
                        var username = this.checkParameter(query, "user");
                        if (!await this.userExists(username)) throw this.returnError("0x0013");
                        var publicKey = (await this.dbquery("SELECT `publicKey` FROM `users` WHERE `username` LIKE ?", [username]))[0].publicKey;
                        response.success = true;
                        response.data = publicKey;
                        break;

                    case "addchatkey":
                        var username = this.checkParameter(query, "user");
                        if (!await this.userExists(username)) throw this.returnError("0x0013");
                        var content = this.checkParameter(query, "content");
                        response.success = (await this.dbquery("UPDATE `users` SET `chatKeysInbox` = JSON_ARRAY_APPEND(`chatKeysInbox`,'$', ?) WHERE `users`.`username` = ?", [content, username])).affectedRows == 1;
                        if(process.env.API_STANDALONE && response.success){
                            this.resolveChatKey(username, content);
                        }
                        break;

                    case "updatechatkeys":
                        var content = this.checkParameter(query, "content");
                        var username = this.checkParameter(query, "username");
                        response.success = (await this.dbquery("UPDATE `users` SET `chatKeys` = ? WHERE `users`.`username` = ?", [content, username])).affectedRows == 1;
                        break;

                    case "getchatkeys":
                        var username = this.checkParameter(query, "username");
                        response.data = (await this.dbquery("SELECT `chatKeys` from `users` WHERE `users`.`username` = ?", [username]))[0].chatKeys;
                        response.success = true;
                        break;

                    case "getchatkeyinbox":
                    case "getchatkeysinbox":
                        var username = this.checkParameter(query, "username");
                        response.data = (await this.dbquery("SELECT `chatKeysInbox` from `users` WHERE `users`.`username` = ?", [username]))[0].chatKeysInbox;
                        response.success = true;
                        break;

                    case "removechatkey":
                    case "removechatkeys":
                        var username = this.checkParameter(query, "username");
                        var content = this.checkParameter(query, "content");
                        for (var i of JSON.parse(content)) {
                            await this.dbquery("UPDATE `users` SET `chatKeysInbox` = JSON_REMOVE(`chatKeysInbox`, JSON_UNQUOTE(JSON_SEARCH(`chatKeysInbox`, 'one', ?))) WHERE JSON_SEARCH(`chatKeysInbox`, 'one', ?) IS NOT NULL AND `username` = ?", [i, i, username]);
                        }
                        response.success = true;
                        break;

                    case "sendmessage":
                    case "sendmsg":
                        var chatid = this.checkParameter(query, "chatid");
                        var content = this.checkParameter(query, "content");
                        var sendtime = dateformat(query.sendtime && query.sendtime >= new Date()? query.sendtime : new Date(), "yyyy-mm-dd HH:MM:ss.l");
                        var encType = query.encType ?? "none";
                        let queryResponse = await this.dbquery("INSERT INTO `messages` (`content`,`chat_id`,`encryptionType`, `timestamp`) VALUES(?, ?, ?, ?)", [content, chatid, encType, sendtime]);
                        response.success = queryResponse.affectedRows == 1;
                        if (process.env.API_STANDALONE && response.success) {
                            // translate variables to fields in table
                            this.resolveChatIds(chatid, [{
                                message_id: queryResponse.insertId,
                                content,
                                chat_id: chatid,
                                encryptionType: encType,
                                timestamp: dateformat(sendtime, "yyyy-mm-dd'T'HH:MM:ss.l'Z'")
                            }]);
                        }
                        break;

                    case "sendfile":
                        var content = this.checkParameter(query, "content");
                        var fileName = forge.util.bytesToHex(forge.random.getBytes(process.env.FILE_NAME_LENGTH));
                        await this.writeFile(content, fileName);
                        response.data = fileName;
                        break;

                    case "getfile":
                        var id = this.checkParameter(query, "id");
                        var fileContent = await this.readFile(id);
                        response.data = fileContent;
                        break;

                    case "getmessages":
                    case "getmsg":
                        var chatid = this.checkParameter(query, "chatid");
                        var limit = isNaN(parseInt(query.limit)) ? process.env.MESSAGE_DEFAULT_LIMIT : parseInt(query.limit);
                        var offset = isNaN(parseInt(query.offset)) ? 0 : parseInt(query.offset);
                        var direction = query.desc ? "DESC" : "ASC";
                        response.data = (await this.dbquery("SELECT * FROM `messages` WHERE `chat_id` LIKE ? AND `timestamp`<=current_timestamp(5) ORDER BY `message_id` " + direction + " LIMIT " + limit + " OFFSET " + offset + ";", [chatid]));
                        break;

                    case "awaitmessages":
                    case "update":
                        var starttime = dateformat(query.starttime ?? new Date(), "yyyy-mm-dd HH:MM:ss.l");
                        response.data = await this.waitForMessage(this.checkParameter(query, "chatids[]"), starttime);
                        break;

                    case "awaitinbox":
                    case "updatechatkeyinbox":
                    case "awaitchatkeyinbox":
                        var username = this.checkParameter(query, "username");
                        var lastKnown = JSON.stringify(query.lastKnown) ?? "[]";
                        do {
                            response.data = (await this.dbquery("SELECT `chatKeysInbox` from `users` WHERE `users`.`username` = ? AND `chatKeysInbox` != ?;", [username, lastKnown]));
                        } while (response.data[0].chatKeysInbox == lastKnown && await this.sleep(50));

                        response.data = response.data[0].chatKeysInbox;
                        break;

                    default:
                        throw this.returnError("0x0005");
                }
            } catch (error) {
                reject(error);
            }
            resolve(response);
        });
    }
}

module.exports = Api;