#!/bin/bash

# Exit on error
set -e

echo "===== Setting up Microservices on Minikube ====="

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "Installing Minikube..."
    brew install minikube
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Installing kubectl..."
    brew install kubectl
fi

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "Installing Helm..."
    brew install helm
fi

# Start minikube if not running
if ! minikube status &> /dev/null; then
    echo "Starting Minikube with 4 CPUs and 4GB RAM..."
    minikube start --cpus 4 --memory 4000 --driver=docker
else
    echo "Minikube is already running."
fi

# Create directories for YAML files
mkdir -p minikube-deployment
cd minikube-deployment

# Create storage-config.yaml
cat > storage-config.yaml << 'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: microservices
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: microservices
data:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: admin
  POSTGRES_DB: orders
EOF

# Create kafka-zookeeper.yaml
cat > kafka-zookeeper.yaml << 'EOF'

# Zookeeper Service
apiVersion: v1
kind: Service
metadata:
  name: zookeeper
  namespace: microservices
spec:
  ports:
  - port: 2181
    targetPort: 2181
  selector:
    app: zookeeper

---
# Zookeeper Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zookeeper
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: zookeeper
  template:
    metadata:
      labels:
        app: zookeeper
    spec:
      containers:
      - name: zookeeper
        image: confluentinc/cp-zookeeper:7.4.0
        ports:
        - containerPort: 2181
        env:
        - name: ZOOKEEPER_CLIENT_PORT
          value: "2181"
        - name: ZOOKEEPER_TICK_TIME
          value: "2000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "300m"

---
# Kafka Service
apiVersion: v1
kind: Service
metadata:
  name: kafka
  namespace: microservices
spec:
  type: ClusterIP
  ports:
  - port: 9092
    targetPort: 9092
  selector:
    app: kafka

---
# Kafka Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      initContainers:
      - name: wait-for-zookeeper
        image: alpine:3.18
        command: ['sh', '-c', 'until nc -zv zookeeper 2181 -w 2; do echo "Waiting for Zookeeper"; sleep 2; done']
      containers:
      - name: kafka
        image: confluentinc/cp-kafka:7.4.0
        env:
        - name: KAFKA_BROKER_ID
          value: "1"
        - name: KAFKA_ZOOKEEPER_CONNECT
          value: "zookeeper:2181"
        - name: KAFKA_LISTENERS
          value: "PLAINTEXT://:9092"
        - name: KAFKA_ADVERTISED_LISTENERS
          value: "PLAINTEXT://kafka:9092"
        - name: KAFKA_AUTO_CREATE_TOPICS_ENABLE
          value: "true"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1"
EOF

# Create postgres.yaml
cat > postgres.yaml << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: microservices
spec:
  ports:
  - port: 5432
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: postgres
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - image: postgres:15
        name: postgres
        envFrom:
        - configMapRef:
            name: postgres-config
        ports:
        - containerPort: 5432
          name: postgres
        volumeMounts:
        - name: postgres-persistent-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-persistent-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
EOF

# Create microservices.yaml
cat > microservices.yaml << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: microservices
spec:
  ports:
  - port: 5014
  selector:
    app: order-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: order-service
  replicas: 1
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: pink27/order-service:latest
        ports:
        - containerPort: 5014
        env:
        - name: DATABASE_URL_PSQL
          value: "postgresql://admin:admin@postgres:5432/orders"
        - name: KAFKA_BROKER
          value: "kafka:9092"
---
apiVersion: v1
kind: Service
metadata:
  name: product-service
  namespace: microservices
spec:
  ports:
  - port: 5010
  selector:
    app: product-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: product-service
  replicas: 1
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: pink27/product-service:latest
        ports:
        - containerPort: 5010
        env:
        - name: KAFKA_BROKER
          value: "kafka:9092"
---
apiVersion: v1
kind: Service
metadata:
  name: wishlist-service
  namespace: microservices
spec:
  ports:
  - port: 5011
  selector:
    app: wishlist-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wishlist-service
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: wishlist-service
  replicas: 1
  template:
    metadata:
      labels:
        app: wishlist-service
    spec:
      containers:
      - name: wishlist-service
        image: pink27/wishlist-service:latest
        ports:
        - containerPort: 5011
        env:
        - name: KAFKA_BROKER
          value: "kafka:9092"
        - name: PRODUCT_SERVICE_URL
          value: "http://product-service:5010"
---
apiVersion: v1
kind: Service
metadata:
  name: ws-chat-service
  namespace: microservices
spec:
  ports:
  - port: 8081
  selector:
    app: ws-chat-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ws-chat-service
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: ws-chat-service
  replicas: 1
  template:
    metadata:
      labels:
        app: ws-chat-service
    spec:
      containers:
      - name: ws-chat-service
        image: pink27/ws-chat-service:latest
        ports:
        - containerPort: 8081
        env:
        - name: KAFKA_BROKER
          value: "kafka:9092"
---
apiVersion: v1
kind: Service
metadata:
  name: notification-service
  namespace: microservices
spec:
  ports:
  - port: 8080
  selector:
    app: notification-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: notification-service
  replicas: 1
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: pink27/notification-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: KAFKA_BROKER
          value: "kafka:9092"
---
apiVersion: v1
kind: Service
metadata:
  name: chat-service
  namespace: microservices
spec:
  ports:
  - port: 5012
  selector:
    app: chat-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-service
  namespace: microservices
spec:
  selector:
    matchLabels:
      app: chat-service
  replicas: 1
  template:
    metadata:
      labels:
        app: chat-service
    spec:
      containers:
      - name: chat-service
        image: pink27/chat-service:latest
        ports:
        - containerPort: 5012
        env:
        - name: KAFKA_BROKER
          value: "kafka:9092"
EOF

# Create prometheus-servicemonitor.yaml for monitoring
cat > prometheus-servicemonitor.yaml << 'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: microservices-monitor
  namespace: monitoring
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      monitoring: enabled
  namespaceSelector:
    matchNames:
      - microservices
  endpoints:
  - port: metrics
    interval: 15s
EOF

# Create port-forward.sh
cat > port-forward.sh << 'EOF'
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
EOF

chmod +x port-forward.sh

# Create namespace
echo "Creating microservices namespace..."
kubectl create namespace microservices || true

# Apply configuration files
echo "Applying configuration files..."
kubectl apply -f storage-config.yaml
kubectl apply -f kafka-zookeeper.yaml
kubectl apply -f postgres.yaml
kubectl apply -f microservices.yaml
kubectl rollout restart deployment ws-chat-service -n microservices
kubectl rollout restart deployment ws-chat-service -n microservices
kubectl rollout restart deployment ws-chat-service -n microservices
# Install Prometheus and Grafana 
echo "Setting up monitoring with Prometheus and Grafana..."
kubectl create namespace monitoring || true
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.enabled=true \
  --set prometheus.service.type=NodePort || true

# kubectl apply -f prometheus-servicemonitor.yaml

echo "===== Setup Complete ====="
echo "To access your services from your local frontend, run:"
echo "./port-forward.sh"
echo ""
echo "To access Grafana dashboard:"
echo "kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo "Then visit http://localhost:3000 (default credentials: admin/prom-operator)"
echo ""
echo "To clean up when done:"
echo "kubectl delete namespace microservices"
echo "kubectl delete namespace monitoring"
echo "minikube stop"