#!/bin/bash

REMOTE_PATH=/var/www/html/monitool
IP=92.243.25.191
CONNECTION=reliefapps@92.243.25.191

#immediately exits if a command exits with an non-zero status
set -e

if [ -z `ssh-keygen -F $IP` ]; then
        ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi

CMD="cd $REMOTE_PATH; \
    echo -e 'getting dev version '; \
    git checkout dev; \
    git pull origin dev; \
    cd docker; \
    echo -e 'Stopping docker containers...'; \
    echo $SSH_PASS | sudo -S docker-compose up --build -d;\
    echo -e 'copying files'; \
    cp compose-develop.yml.dist docker-compose.yml;\
    echo -e 'Starting docker containers...'; \
    echo $SSH_PASS | sudo -S docker-compose up --build -d;\
    "
ssh -i $1 $CONNECTION $CMD

echo -e "Deployed in DEV!!!"
