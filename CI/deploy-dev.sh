#!/bin/bash

REMOTE_PATH=/var/www/html/monitool

CONNECTION=reliefapps@92.243.25.191

echo -e "Synchronizing files and restarting the docker ..."
CMD="cd ${REMOTE_PATH}; \
    git checkout dev; \
    git pull origin dev; \
    sudo cp compose-develop.yml docker-compose.yml;\
    sudo docker-compose up --build\
    "
ssh -oStrictHostKeyChecking=no -o PubkeyAuthentication=yes $CONNECTION "$CMD"

echo -e "Deployed !!!"
