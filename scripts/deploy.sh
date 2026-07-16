#!/bin/bash
# Phase 2: Production Polish - Deployment Script

set -e

echo "🚀 Starting Unified Editing Studio Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_IMAGE="${DOCKER_USERNAME:-studio}/studio-backend:latest"
FRONTEND_IMAGE="${DOCKER_USERNAME:-studio}/studio-frontend:latest"
KUBE_NAMESPACE="${KUBE_NAMESPACE:-production}"

echo -e "${GREEN}Step 1: Docker Images${NC}"
docker pull $BACKEND_IMAGE || echo "Backend image not found, building..."
docker pull $FRONTEND_IMAGE || echo "Frontend image not found, building..."

echo -e "${GREEN}Step 2: Deploy to Kubernetes${NC}"
kubectl config use-context $KUBE_CONTEXT
kubectl create namespace $KUBE_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Deploy backend
kubectl apply -f k8s/ -n $KUBE_NAMESPACE

echo -e "${GREEN}Step 3: Wait for deployment${NC}"
kubectl rollout status deployment/studio-backend -n $KUBE_NAMESPACE
kubectl rollout status deployment/studio-frontend -n $KUBE_NAMESPACE

echo -e "${GREEN}Step 4: Verify deployment${NC}"
kubectl get pods -n $KUBE_NAMESPACE
kubectl get services -n $KUBE_NAMESPACE

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Health check
echo -e "${YELLOW}Running health check...${NC}"
for i in {1..30}; do
  if curl -f http://studio.unifiedediting.com/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    exit 0
  fi
  echo "Health check attempt $i/30..."
  sleep 2
done

echo -e "${RED}❌ Health check failed!${NC}"
exit 1