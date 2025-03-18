#!/bin/bash

kubectl port-forward -n microservices svc/order-service 5014:5014 &
kubectl port-forward -n microservices svc/product-service 5010:5010 &
kubectl port-forward -n microservices svc/wishlist-service 5011:5011 &
kubectl port-forward -n microservices svc/ws-chat-service 8081:8081 &
kubectl port-forward -n microservices svc/notification-service 8080:8080 &
kubectl port-forward -n microservices svc/chat-service 5012:5012 &
kubectl port-forward -n microservices svc/postgres 5432:5432 &
kubectl port-forward -n microservices svc/kafka 9092:9092 &
kubectl port-forward -n microservices svc/zookeeper 2181:2181 &

echo "All services are now forwarded to localhost."
echo "Press Ctrl+C to stop all port forwarding."

# Wait for Ctrl+C
trap "pkill -P $$; exit" SIGINT SIGTERM
wait
