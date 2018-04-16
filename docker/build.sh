
# This script builds and publish the docker images that are needed to run monitool.

docker image build -t medecinsdumonde/monitool-api:latest ../api
docker image build -t medecinsdumonde/monitool-frontend:latest ../frontend

docker image push medecinsdumonde/monitool-api
docker image push medecinsdumonde/monitool-frontend
