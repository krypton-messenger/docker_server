const serveStatic = require("serve-static"),
    fs = require("fs");

class Static {
    constructor() {
        this.root = process.env.PUBLIC_HTML;
        this.fileServer = serveStatic(this.root, {
            index: ['index.html', 'index.htm'],
            dotfiles: "ignore",
            fallthrough: true
        });
    }

    displayErrorPage(_req, res) {
        res.end(fs.readFileSync(this.root + "err/404.html"));
    }

    handleRequest(req, res) {
        console.log(`static: ${req.url} ip: ${req.connection.remoteAddress}, ${req.headers['x-forwarded-for'] ?? "not using a proxy"}`);
        this.fileServer(req, res, this.displayErrorPage.bind(this, req, res));
    }
}
module.exports = Static;