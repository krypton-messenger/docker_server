FROM ubuntu

# install tor
RUN apt update
RUN apt install tor -y

# install journalctl
RUN apt install python3 -y

# add config
COPY config/torrc /etc/tor/torrc

# add main script
COPY main.py /main.py

RUN service tor start

CMD [ "python3 /main.py"]