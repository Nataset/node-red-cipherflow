#!/bin/sh
docker rm -f commit 
docker run -d -it -p 2000:1880 --name commit nodered/node-red:2.2.2
docker exec -u 0 commit rm -fr /data
docker cp /Users/nataset/dev/cipherflow commit:/data
docker exec -u 0 chown -R node-red:node-red /data
docker commit commit nataset/node-red-cipherflow:0.1.4_arm64
docker push nataset/node-red-cipherflow:0.1.4_arm64
docker rm -f commit 
