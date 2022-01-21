FROM ubuntu

# install tor
RUN apt update
RUN apt install tor -y
COPY config/torrc /etc/tor/torrc

CMD [ "service", "tor", "start", "&&", "cat", "/var/lib/tor/service/hostname"]