# Build API
docker image build -t romaingilliotte/monitool-api:latest api
docker image push romaingilliotte/monitool-api

# Build frontend
docker image build -t romaingilliotte/monitool-frontend:latest frontend
docker image push romaingilliotte/monitool-frontend
