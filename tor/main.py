import os, time
print("waiting for web to be reachable")
while True:
    time.sleep(5)
    returnState = os.system("ping -c 1 web")
    print("returnState:",returnState)
    if returnState == 0:
        print("web is up")
        break
    print("web is not yet up")
print("attempting to start tor")
print(os.popen("service tor start").read())

while True:
    time.sleep(5)
    if os.popen("service tor status").read().find("running") == -1:
        exit(1)
        break
