import os, time
print("waiting for web to be reachable")
# wait for server to be up
while True:
    returnState = os.system("ping -c 1 web")
    print("returnState:",returnState)
    if returnState == 0:
        print("web is up")
        break
    print("web is not yet up")
    time.sleep(5)

# start service
print("attempting to start tor")
print(os.popen("service tor start").read())

# wait for hostname
while True:
    if os.path.exists("/var/lib/tor/service/hostname"):
        with open("/var/lib/tor/service/hostname") as f:
            print("hostname:", f.read())
        break
    time.sleep(5)

# exit if service stops
while True:
    if os.popen("service tor status").read().find("running") == -1:
        exit(1)
        break
    time.sleep(5)
