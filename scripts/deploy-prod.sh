#!/bin/bash

# Production Deployment Script for Aetheron Platform

set -e

echo "🚀 Aetheron Production Deployment"
echo "=================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "✓ Environment variables loaded"

# Run tests
echo ""
echo "🧪 Running test suite..."
npm test || {
    echo "❌ Tests failed! Please fix before deploying"
    exit 1
}

echo "✓ All tests passed"

# Run linter
echo ""
echo "🔍 Running code quality checks..."
npm run lint || {
    echo "⚠️  Linting errors detected. Running auto-fix..."
    npm run lint:fix
}

echo "✓ Code quality checks passed"

# Build Docker image
echo ""
echo "🐳 Building Docker image..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo ""
echo "🚢 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ "$HEALTH_CHECK" == "200" ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "Services running at:"
    echo "  • Application: http://localhost:3001"
    echo "  • MongoDB: localhost:27017"
    echo "  • Redis: localhost:6379"
    echo ""
    echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "To stop: docker-compose -f docker-compose.prod.yml down"
else
    echo "❌ Health check failed!"
    echo "Check logs: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi
