#!/bin/sh
docker rm -f commit 
docker run -d -it --name commit -p 2000:1880 nodered/node-red:2.2.2
docker exec -u 0 commit rm -fr /data
docker cp /Users/nataset/dev/cipherflow commit:/data
docker exec -u 0 commit chown -R node-red:node-red /data
docker commit commit nataset/node-red-cipherflow:0.1.8_arm64
docker push nataset/node-red-cipherflow:0.1.8_arm64
docker push nataset/node-red-cipherflow
docker rm -f commit 
