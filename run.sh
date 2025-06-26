#!/bin/bash

DOCKERFILE="Dockerfile"

docker build -t node_server -f "$DOCKERFILE" .

docker run -it --rm \
    --init \
    --name node_signaling_server \
    --net host \
    --ipc host \
    --privileged \
  node_server
