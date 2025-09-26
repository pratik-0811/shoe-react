#!/bin/bash

# Production Deployment Script for Shoe Store Backend
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production deploy

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
ACTION=${2:-deploy}
APP_NAME="shoe-backend"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Please create it from .env.production template."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    mkdir -p logs uploads backups ssl
    chmod 755 logs uploads backups
    
    log_success "Directories created"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.gz"
        
        # Create backup directory if it doesn't exist
        mkdir -p "$BACKUP_DIR"
        
        # Backup using mongodump
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongo mongodump --archive --gzip > "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            log_success "Database backup created: $BACKUP_FILE"
        else
            log_error "Database backup failed"
            exit 1
        fi
    else
        log_warning "Skipping backup for non-production environment"
    fi
}

# Build and deploy application
deploy_application() {
    log "Deploying application..."
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build application image
    log "Building application image..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache app
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    if health_check; then
        log_success "Application deployed successfully"
    else
        log_error "Application deployment failed health check"
        exit 1
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:5000/health > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback to previous version
rollback() {
    log "Rolling back to previous version..."
    
    # Stop current containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore from backup if available
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.gz 2>/dev/null | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        log "Restoring database from backup: $LATEST_BACKUP"
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d mongo
        sleep 10
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongo mongorestore --archive --gzip < "$LATEST_BACKUP"
    fi
    
    # Start containers with previous image
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log_success "Rollback completed"
}

# Clean up old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [ "$ENVIRONMENT" != "production" ]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

# Show logs
show_logs() {
    log "Showing application logs..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f --tail=100 app
}

# Show status
show_status() {
    log "Showing service status..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    log "Health check status:"
    curl -s http://localhost:5000/health | jq . || echo "Health endpoint not responding"
}

# Main execution
main() {
    log "Starting deployment script for $APP_NAME in $ENVIRONMENT environment"
    log "Action: $ACTION"
    
    case $ACTION in
        "deploy")
            check_prerequisites
            setup_directories
            backup_database
            deploy_application
            cleanup
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "backup")
            backup_database
            ;;
        *)
            echo "Usage: $0 [environment] [action]"
            echo "Environments: production, staging, development"
            echo "Actions: deploy, rollback, health, logs, status, cleanup, backup"
            exit 1
            ;;
    esac
    
    log_success "Script completed successfully"
}

# Run main function
main "$@"