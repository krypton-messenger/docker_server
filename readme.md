
# Dockerfile
## build
`docker build --tag kr-srvr .`
## run
`docker run -p 8080:80 --name test kr-srvr`

# Docker compose
`docker-compose up -d --build`