
docker image build -t romaingilliotte/monitool-api:latest -f api/Dockerfile.prod api
docker image build -t romaingilliotte/monitool-frontend:latest -f frontend/Dockerfile.prod frontend
