FROM ubuntu

# install tor
RUN apt update
RUN apt install tor -y

RUN ln /tor/service /var/lib/tor/service
RUN cp /tor/cofig/torrc /etc/tor/torrc

CMD [ "service", "tor", "start" ]