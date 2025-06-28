#!/bin/bash

# Enrich Deployment Script
set -e

echo "Starting deployment..."

# Load environment variables
if [ -f .env.prod ]; then
    source .env.prod
else
    echo "Warning: .env.prod not found, using defaults"
fi

# Build production images
echo "Building production images..."
docker-compose -f docker-compose.prod.yml build

# Run tests
echo "Running tests..."
npm test

# Run load tests
echo "Running load tests..."
npm run load-test

# Deploy to production
echo "Deploying to production..."
docker-compose -f docker-compose.prod.yml up -d

# Health check
echo "Performing health check..."
sleep 30

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ $HEALTH_CHECK -eq 200 ]; then
    echo "Deployment successful! Service is healthy."
else
    echo "Deployment failed! Health check returned: $HEALTH_CHECK"
    exit 1
fi

echo "Deployment complete!"
