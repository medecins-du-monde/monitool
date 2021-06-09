#!/bin/bash

REMOTE_PATH=/var/www/html/monitool
IP=52.148.234.173
CONNECTION=medecinsdumonde@52.148.234.173

#immediately exits if a command exits with an non-zero status
set -e

if [ -z `ssh-keygen -F $IP` ]; then
        ssh-keyscan -H $IP >> ~/.ssh/known_hosts
fi

CMD="cd $REMOTE_PATH; \
    echo -e 'getting uat version'; \
    git checkout uat; \
    git pull origin uat; \
    cd docker; \
    echo -e 'Updating the docker swarm'; \
    sudo docker stack deploy --resolve-image never -c compose-production.yml monitool-prod;\
    "
ssh -i $1 $CONNECTION $CMD

echo -e "Deployed in UAT!!!"
