#!/bin/bash

REMOTE_PATH=/var/www/html/monitool

CONNECTION=reliefapps@92.243.25.191

echo -e "Synchronizing files and restarting the docker ..."
CMD="cd ${REMOTE_PATH}; \
    echo -e 'checking out dev'; \
    git checkout dev; \
    git pull origin dev; \
    echo -e 'running docker compose'; \
    sudo cp compose-develop.yml docker-compose.yml;\
    sudo docker-compose up --build\
    "
ssh -oStrictHostKeyChecking=no -o PubkeyAuthentication=yes $CONNECTION "$CMD"

echo -e "Deployed !!!"
