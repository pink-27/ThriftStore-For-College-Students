#!/bin/bash
# traefik load balancer
# Set your Docker Hub username
DOCKER_HUB_USER="pink27"

# Define the services to be built and pushed
SERVICES=("chat-service" "ws-chat-service" "notification-service" "product-service" "wishlist-service" "order-service")

echo "🚀 Stopping and removing all running containers..."
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

echo "🧹 Deleting all Docker images..."
docker rmi $(docker images -q) -f 2>/dev/null

# Loop through each service, build and push to Docker Hub
for SERVICE in "${SERVICES[@]}"; do
  echo "🔨 Building image for $SERVICE..."
  docker build -t "$DOCKER_HUB_USER/$SERVICE:latest" "./$SERVICE"

  echo "📤 Pushing $SERVICE to Docker Hub..."
  docker push "$DOCKER_HUB_USER/$SERVICE:latest"
done

docker-compose down

docker-compose up --build -d


echo "✅ All services built and pushed successfully!"
