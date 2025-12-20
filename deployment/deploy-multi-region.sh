#!/bin/bash

# Multi-Region Deployment Script for Aetheron
# Deploys to US-East, US-West, EU-West, and AP-Southeast

set -e

REGIONS=("us-east-1" "us-west-2" "eu-west-1" "ap-southeast-1")
IMAGE="registry.aetheron.io/aetheron:latest"
VERSION=${1:-latest}

echo "🚀 Starting multi-region deployment for Aetheron v${VERSION}"

# Build and tag image
echo "📦 Building Docker image..."
docker build -t aetheron:${VERSION} .
docker tag aetheron:${VERSION} ${IMAGE}

# Push to registry
echo "⬆️  Pushing to container registry..."
docker push ${IMAGE}

# Deploy to each region
for REGION in "${REGIONS[@]}"; do
  echo ""
  echo "🌍 Deploying to ${REGION}..."
  
  # Set region-specific configuration
  export DEPLOY_REGION=${REGION}
  export DEPLOY_IMAGE=${IMAGE}
  export DEPLOY_VERSION=${VERSION}
  
  # Deploy using docker-compose or kubernetes
  if [ -f "deployment/${REGION}/docker-compose.yml" ]; then
    echo "  Using Docker Compose for ${REGION}..."
    docker-compose -f deployment/${REGION}/docker-compose.yml up -d
  elif [ -f "deployment/${REGION}/k8s-deployment.yml" ]; then
    echo "  Using Kubernetes for ${REGION}..."
    kubectl apply -f deployment/${REGION}/k8s-deployment.yml
  else
    echo "  ⚠️  No deployment config found for ${REGION}, skipping..."
    continue
  fi
  
  # Health check
  echo "  🏥 Waiting for health check..."
  sleep 10
  
  HEALTH_URL="https://aetheron-${REGION}.io/health"
  for i in {1..5}; do
    if curl -sf ${HEALTH_URL} > /dev/null; then
      echo "  ✅ ${REGION} is healthy!"
      break
    else
      echo "  ⏳ Attempt ${i}/5 - waiting for ${REGION}..."
      sleep 5
    fi
  done
done

echo ""
echo "✨ Multi-region deployment complete!"
echo ""
echo "📊 Deployment Summary:"
echo "  Version: ${VERSION}"
echo "  Regions: ${REGIONS[@]}"
echo "  Image: ${IMAGE}"
echo ""
echo "🔗 Regional endpoints:"
for REGION in "${REGIONS[@]}"; do
  echo "  - https://aetheron-${REGION}.io"
done
echo ""
echo "📈 Monitoring: https://grafana.aetheron.io"
echo "🔔 Alerts: https://alerts.aetheron.io"
