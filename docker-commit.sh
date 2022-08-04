#!/bin/sh
docker rm -f commit 
docker run -d -it -p 2000:1880 --name commit nodered/node-red:2.2.2
docker exec -u 0 commit rm -fr /data
docker cp /home/nataset/dev/cipherflow commit:/data
docker commit commit nataset/node-red-cipherflow
docker push nataset/node-red-cipherflow
docker rm -f commit 
