#!/bin/bash

REMOTE_PATH=/var/www/html/monitool
IP=92.243.25.191
CONNECTION=reliefapps@92.243.25.191

#immediately exits if a command exits with an non-zero status
set -e

if [ -z `ssh-keygen -F $IP` ]; then
        ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi

echo -e "Synchronizing files and restarting the docker ..."
CMD="cd ${REMOTE_PATH}; \
    echo -e 'checking out dev'; \
    git checkout dev; \
    git pull origin dev; \
    echo -e 'running docker compose'; \
    cd docker; \
    cp compose-develop.yml.dist docker-compose.yml;\
    sudo docker-compose up --build -T;\
    "
ssh -i $1 $CONNECTION $CMD

echo -e "Deployed !!!"
