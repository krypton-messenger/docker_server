FROM ubuntu

# install tor
RUN apt update
RUN apt install tor -y

# install journalctl
RUN apt install python3 -y

# add config
COPY config/torrc /etc/tor/torrc

# add main script
RUN mkdir /code
COPY main.py /code/main.py

CMD python3 /code/main.py