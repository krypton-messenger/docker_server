
# Krypton Server
## installation
### installing docker-compose
`sudo apt install docker-compose`
### clone repo
`git clone https://github.com/krypton-messenger/docker_server.git`
### config
- edit ssl.env
    - CERT_ROOT `path: /letsencrypt/live/[DOMAINNAME]/[PEMFILE]`
    - DOMAINNAME `domain: example.com`
    - SSL_KEY `filename: privkey.pem`
    - SSL_CERT `filename: fullchain.pem`
    - ENABLE_SSL `boolean: true`
### getting your certificates
if you do not allready have a certificate for your domain, you can get one for free with `certbot`. 

Config the server to ENABLE_SSL=false, since you do not have a certificate at the moment. After that, run `docker-compose up -d` to start the server. have a look at the logs with `docker-compose logs web` to ensure that the server is running, or curl it on its port defined i `envVariables.env` (default is 80).
If your server is running, follow the instructions on https://certbot.eff.org/instructions and choose `webroot`.

The well-known folder for the acme-challenge is located inside the cloned repo: you can indicate `~/docker_server/.wellKnown` as webroot. 
If you wish, you can activate the automatic renewal, but note that the server needs to be restarted if a new certificate is issued since the certificate is read at server startup.

If the certificate has been issued, rebuid the server (`docker-compose up -d --build`) with ssl enabled (`ssl.env`=> `ENABLE_SSL=true`)
## starting your servers
`docker-compose up -d --build`
## terminating the servers
`docker-compose stop` or
`docker-compose kill`

## debugging
### entering the shell of a server
`docker-compose exec [server-name] bash` where `[server-name]` needs to be replaced with `web` or `db`
### looking at the logs
#### web-server's logs
`docker-compose logs web`
#### database's logs
`docker-compose logs db`
#### combined
`docker-compose logs`