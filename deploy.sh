#!/bin/bash

# Production Deployment Script for Shoe Store Application
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Shoe Store Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Please copy .env.example to .env and configure it."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_status "Created .env from .env.example. Please configure it before continuing."
            exit 1
        fi
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check frontend
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "✅ Frontend is healthy"
    else
        print_warning "⚠️  Frontend health check failed"
    fi
    
    # Check backend
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "✅ Backend is healthy"
    else
        print_warning "⚠️  Backend health check failed"
    fi
    
    # Check database connection
    if docker-compose exec -T backend node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('DB Connected')).catch(console.error)" > /dev/null 2>&1; then
        print_status "✅ Database connection is healthy"
    else
        print_warning "⚠️  Database connection check failed"
    fi
}

# Show deployment info
show_info() {
    print_status "Deployment completed successfully! 🎉"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000/api"
    echo "   API Documentation: http://localhost:5000/api/docs"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo "   View status: docker-compose ps"
    echo ""
    echo "📊 Monitoring:"
    echo "   Container stats: docker stats"
    echo "   System resources: docker system df"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up old images and containers..."
    docker system prune -f
    docker image prune -f
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    check_requirements
    deploy_services
    health_check
    show_info
    
    # Optional cleanup
    read -p "Do you want to clean up old Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
    
    print_status "Deployment process completed! 🚀"
}

# Handle script arguments
case "${1:-}" in
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "stop")
        print_status "Stopping all services..."
        docker-compose down
        ;;
    "restart")
        print_status "Restarting all services..."
        docker-compose restart
        ;;
    *)
        main
        ;;
esac