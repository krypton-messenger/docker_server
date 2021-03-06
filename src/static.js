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

    displayErrorPage(req, res) {
        res.setHeader("Content-Type", "text/html");
        res.end(fs.readFileSync(this.root + "err/404.html"));
        console.log('\x1b[31m%s\x1b[0m', `static: \t${req.url} \tip: ${req.connection.remoteAddress}, ${req.headers['x-forwarded-for'] ?? "not using a proxy"}`);
    }

    async handleRequest(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader("X-Powered-By", "ttschnz");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'self'; style-src fonts.googleapis.com 'self'; font-src fonts.gstatic.com; script-src cdnjs.cloudflare.com code.jquery.com 'self'; img-src data: 'self'");
        console.log(`static: \t${req.url} \tip: ${req.connection.remoteAddress}, ${req.headers['x-forwarded-for'] ?? "not using a proxy"}`);
        this.fileServer(req, res, this.displayErrorPage.bind(this, req, res))
    }
}
module.exports = Static;