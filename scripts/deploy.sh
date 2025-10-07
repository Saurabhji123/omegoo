#!/bin/bash

# Omegoo Deployment Script
set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}

echo "🚀 Deploying Omegoo PWA to $ENVIRONMENT environment (version: $VERSION)..."

# Load environment-specific variables
case $ENVIRONMENT in
    "production")
        COMPOSE_FILE="docker-compose.yml"
        COMPOSE_PROFILE="production"
        ;;
    "staging")
        COMPOSE_FILE="docker-compose.staging.yml"
        COMPOSE_PROFILE="staging"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: production, staging"
        exit 1
        ;;
esac

# Pre-deployment checks
pre_deployment_checks() {
    echo "📋 Running pre-deployment checks..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        exit 1
    fi
    
    # Check environment files
    if [ ! -f backend/.env ]; then
        echo "❌ Backend .env file missing"
        exit 1
    fi
    
    if [ ! -f frontend/.env ]; then
        echo "❌ Frontend .env file missing"
        exit 1
    fi
    
    # Check SSL certificates for production
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ ! -f nginx/ssl/omegoo.app.crt ] || [ ! -f nginx/ssl/omegoo.app.key ]; then
            echo "❌ SSL certificates missing for production deployment"
            exit 1
        fi
    fi
    
    echo "✅ Pre-deployment checks passed"
}

# Build images
build_images() {
    echo "🔨 Building Docker images..."
    
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Tag images with version
    docker tag omegoo_frontend:latest omegoo_frontend:$VERSION
    docker tag omegoo_backend:latest omegoo_backend:$VERSION
    
    echo "✅ Docker images built and tagged"
}

# Database migration
run_migrations() {
    echo "🗄️ Running database migrations..."
    
    # Start database first
    docker-compose -f $COMPOSE_FILE up -d postgres redis
    
    # Wait for database
    sleep 10
    
    # Run migrations
    docker-compose -f $COMPOSE_FILE run --rm backend npm run db:migrate
    
    echo "✅ Database migrations completed"
}

# Deploy application
deploy_application() {
    echo "🚀 Deploying application..."
    
    # Stop existing containers
    docker-compose -f $COMPOSE_FILE --profile $COMPOSE_PROFILE down
    
    # Start all services
    docker-compose -f $COMPOSE_FILE --profile $COMPOSE_PROFILE up -d
    
    echo "✅ Application deployed"
}

# Health checks
health_checks() {
    echo "🏥 Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if ! curl -f http://localhost:3001/health; then
        echo "❌ Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    if ! curl -f http://localhost:3000/health; then
        echo "❌ Frontend health check failed"
        exit 1
    fi
    
    echo "✅ Health checks passed"
}

# Cleanup old images
cleanup() {
    echo "🧹 Cleaning up old Docker images..."
    
    docker image prune -f
    docker system prune -f
    
    echo "✅ Cleanup completed"
}

# Backup database (production only)
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "💾 Creating database backup..."
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $BACKUP_DIR
        
        docker-compose exec postgres pg_dump -U omegoo omegoo > $BACKUP_DIR/database.sql
        
        # Keep only last 7 backups
        ls -t backups/ | tail -n +8 | xargs -I {} rm -rf backups/{}
        
        echo "✅ Database backup created: $BACKUP_DIR"
    fi
}

# Post-deployment tasks
post_deployment() {
    echo "📊 Running post-deployment tasks..."
    
    # Send deployment notification (implement your notification system)
    # curl -X POST "https://hooks.slack.com/..." -d "Omegoo deployed to $ENVIRONMENT"
    
    # Update monitoring dashboards
    # curl -X POST "https://monitoring.omegoo.app/deployments" -d "{\"environment\":\"$ENVIRONMENT\",\"version\":\"$VERSION\"}"
    
    echo "✅ Post-deployment tasks completed"
}

# Main deployment flow
main() {
    backup_database
    pre_deployment_checks
    build_images
    run_migrations
    deploy_application
    health_checks
    cleanup
    post_deployment
    
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Application is running at:"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "   https://omegoo.app"
    else
        echo "   http://localhost"
    fi
}

# Execute main function
main "$@"