FROM ubuntu

# install tor
RUN apt update
RUN apt install tor -y

# install journalctl
RUN apt install python3 -y

# install ping
RUN apt install iputils-ping -y

# add config
COPY config/torrc /etc/tor/torrc

# add main script
RUN mkdir /code
COPY main.py /code/main.py

CMD python3 -u /code/main.py