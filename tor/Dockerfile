FROM ubuntu

# install tor
RUN apt update
RUN apt install tor -y

# install journalctl
RUN apt install systemd -y

# add config
COPY config/torrc /etc/tor/torrc

CMD [ "service", "tor", "start", "&&", "cat", "/var/lib/tor/service/hostname", "&&", "journalctl", "-f"]