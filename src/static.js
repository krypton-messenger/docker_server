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
        console.log("static:", req.url);
        if (req.url == "/.well-known/acme-challenge/s9I-DUnw_bs_m54xyfzB1xAlHVnd1LTKdC3rvugW--c") {
            res.setHeader('Content-Type', 'text/plain');
            res.end("s9I-DUnw_bs_m54xyfzB1xAlHVnd1LTKdC3rvugW--c.tWVE0VTCuUolSkIKrt36w3xLmHNOE3lkd52xQAjCfXc");
        } else {
            this.fileServer(req, res, this.displayErrorPage.bind(this, req, res));
        }
    }
}
module.exports = Static;