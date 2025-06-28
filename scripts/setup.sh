#!/bin/bash

# Enrich Setup Script
echo "Setting up Enrich..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p tests/load/results

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Install dependencies if package.json exists
if [ -f package.json ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Build Docker images
echo "Building Docker images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Check service health
echo "Checking service health..."
curl -f http://localhost:3000/health || echo "API service not ready"
curl -f http://localhost:3001/health || echo "Sync vendor not ready"
curl -f http://localhost:3002/health || echo "Async vendor not ready"

echo "Setup complete!"
echo "API available at: http://localhost:3000"
echo "Sync Vendor at: http://localhost:3001"
echo "Async Vendor at: http://localhost:3002"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"