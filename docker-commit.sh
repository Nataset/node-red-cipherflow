#!/bin/sh
docker rm -f commit 
docker run -d -it -p 1880:1880 --name commit nodered/node-red
docker exec -u 0 commit rm -fr /data
docker cp /Users/nataset/dev/node-red commit:/data
docker commit commit nataset/node-red-seal
docker push nataset/node-red-seal
