import os, time

print(os.popen("service tor start").read())

while True:
    time.sleep(5)
    if os.popen("service tor status").read().find("running") == -1:
        exit(1)
        break
