#!/bin/bash

# Omegoo Development Setup Script
set -e

echo "🚀 Setting up Omegoo PWA development environment..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -c2-)
    REQUIRED_VERSION="18.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        echo "❌ Node.js version $REQUIRED_VERSION or higher is required. Found: $NODE_VERSION"
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Install workspace dependencies
    npm install
    
    # Install frontend dependencies
    cd frontend && npm install && cd ..
    
    # Install backend dependencies  
    cd backend && npm install && cd ..
    
    # Install shared dependencies
    cd shared && npm install && cd ..
    
    echo "✅ Dependencies installed"
}

# Setup environment files
setup_env_files() {
    echo "⚙️ Setting up environment files..."
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        echo "📄 Created backend/.env from example"
    fi
    
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
        echo "📄 Created frontend/.env from example"
    fi
    
    echo "⚠️ Please configure your environment variables in .env files"
    echo "✅ Environment files setup complete"
}

# Setup database
setup_database() {
    echo "🗄️ Setting up database..."
    
    # Start PostgreSQL and Redis with Docker
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    docker-compose exec postgres psql -U omegoo -d omegoo -c "SELECT version();" || {
        echo "❌ Database connection failed"
        exit 1
    }
    
    echo "✅ Database setup complete"
}

# Generate SSL certificates for development
generate_dev_certs() {
    echo "🔒 Generating development SSL certificates..."
    
    mkdir -p nginx/ssl
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/omegoo.app.key \
        -out nginx/ssl/omegoo.app.crt \
        -subj "/C=IN/ST=Delhi/L=Delhi/O=Omegoo/CN=localhost"
    
    echo "✅ Development SSL certificates generated"
}

# Final setup
final_setup() {
    echo "🎯 Final setup steps..."
    
    # Create logs directory
    mkdir -p logs
    
    # Set proper permissions
    chmod +x scripts/*.sh
    
    echo "✅ Setup complete!"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo "  npm run dev           # Start development servers"
    echo "  docker-compose up     # Start with Docker"
    echo "  npm run build:all     # Build all projects"
    echo ""
    echo "📚 Documentation:"
    echo "  README.md            # Project overview"
    echo "  docs/               # Detailed documentation"
    echo ""
    echo "🔧 Configuration:"
    echo "  backend/.env        # Backend configuration"
    echo "  frontend/.env       # Frontend configuration"
}

# Main execution
main() {
    check_prerequisites
    install_dependencies
    setup_env_files
    setup_database
    generate_dev_certs || echo "⚠️ SSL certificate generation failed (optional for development)"
    final_setup
}

# Run main function
main "$@"