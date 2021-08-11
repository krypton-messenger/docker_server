const serveStatic = require("serve-static"),
    fs = require("fs");

class WellKnown {
    constructor() {
        this.root = process.env.WELL_KNOWN_BASE;
        this.fileServer = serveStatic(this.root, {
            index: false,
            dotfiles: "allow",
            fallthrough: true
        });
    }

    displayErrorPage(_req, res) {
        res.end("ERROR: unknown /.well-known/ service");
    }

    handleRequest(req, res) {
        console.log("well-known: \t", req.url);
        this.fileServer(req, res, this.displayErrorPage.bind(this, req, res));
    }
}
module.exports = WellKnown;