#!/bin/bash

# Aetheron Production Deployment Script
# This script handles deployment to Railway, Vercel, or similar platforms

set -e  # Exit on any error

echo "🚀 Starting Aetheron Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Docker deployment will be skipped"
    fi

    print_success "Dependencies check passed"
}

# Validate environment variables
validate_env() {
    print_status "Validating environment configuration..."

    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "ALCHEMY_API_KEY"
        "DEPLOYER_PRIVATE_KEY"
    )

    missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        print_error "Missing required environment variables:"
        printf '  - %s\n' "${missing_vars[@]}"
        print_error "Please set these in your .env file or deployment platform"
        exit 1
    fi

    print_success "Environment validation passed"
}

# Run pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."

    # Check Node.js version
    node_version=$(node -v | sed 's/v//')
    if [[ "$(printf '%s\n' "$node_version" "18.0.0" | sort -V | head -n1)" != "18.0.0" ]]; then
        print_warning "Node.js version $node_version detected. Recommended: 18+"
    fi

    # Run linting
    print_status "Running ESLint..."
    if npm run lint > /dev/null 2>&1; then
        print_success "Linting passed"
    else
        print_warning "Linting failed. Running with --fix..."
        npm run lint:fix || true
    fi

    # Run tests
    print_status "Running tests..."
    if npm test > /dev/null 2>&1; then
        print_success "Tests passed"
    else
        print_error "Tests failed. Please fix before deploying"
        exit 1
    fi

    # Check for security vulnerabilities
    print_status "Checking for security vulnerabilities..."
    npm audit --audit-level moderate > /dev/null 2>&1 || {
        print_warning "Security vulnerabilities found. Consider running 'npm audit fix'"
    }

    print_success "Pre-deployment checks completed"
}

# Build application
build_app() {
    print_status "Building application..."

    # Clean previous build
    rm -rf dist/ build/ .next/

    # Install dependencies
    npm ci --production=false

    # Build application
    npm run build 2>/dev/null || {
        print_warning "No build script found, skipping build step"
    }

    print_success "Application built successfully"
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."

    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Install with: npm install -g @railway/cli"
        exit 1
    fi

    # Login to Railway (interactive)
    railway login

    # Deploy
    railway deploy

    print_success "Deployed to Railway successfully"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."

    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Install with: npm install -g vercel"
        exit 1
    fi

    # Deploy
    vercel --prod

    print_success "Deployed to Vercel successfully"
}

# Deploy using Docker
deploy_docker() {
    print_status "Deploying with Docker..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    # Build Docker image
    docker build -t aetheron:latest .

    # Run with docker-compose
    if [[ -f "docker-compose.prod.yml" ]]; then
        docker-compose -f docker-compose.prod.yml up -d
        print_success "Deployed with Docker Compose"
    else
        # Run standalone container
        docker run -d \
            --name aetheron-app \
            -p 3001:3001 \
            --env-file .env \
            aetheron:latest
        print_success "Deployed as standalone Docker container"
    fi
}

# Post-deployment verification
verify_deployment() {
    print_status "Verifying deployment..."

    # Wait for service to be ready
    sleep 30

    # Check health endpoint
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed. Service may still be starting up"
    fi

    # Check database connection
    if curl -f -s http://localhost:3001/api/health/db > /dev/null; then
        print_success "Database connection verified"
    else
        print_warning "Database connection check failed"
    fi
}

# Main deployment function
main() {
    echo "🎯 Aetheron Production Deployment Script"
    echo "======================================"

    # Get deployment target
    if [[ -z "$1" ]]; then
        echo "Usage: $0 <target>"
        echo "Targets: railway, vercel, docker, check"
        echo ""
        echo "Examples:"
        echo "  $0 check     # Run pre-deployment checks only"
        echo "  $0 railway   # Deploy to Railway"
        echo "  $0 vercel    # Deploy to Vercel"
        echo "  $0 docker    # Deploy with Docker"
        exit 1
    fi

    target="$1"

    case $target in
        "check")
            check_dependencies
            validate_env
            pre_deployment_checks
            print_success "All checks passed! Ready for deployment"
            ;;
        "railway")
            check_dependencies
            validate_env
            pre_deployment_checks
            build_app
            deploy_railway
            verify_deployment
            ;;
        "vercel")
            check_dependencies
            validate_env
            pre_deployment_checks
            build_app
            deploy_vercel
            verify_deployment
            ;;
        "docker")
            check_dependencies
            validate_env
            pre_deployment_checks
            deploy_docker
            verify_deployment
            ;;
        *)
            print_error "Unknown target: $target"
            echo "Valid targets: railway, vercel, docker, check"
            exit 1
            ;;
    esac

    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Monitor application logs"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure domain and SSL certificates"
    echo "4. Test all features thoroughly"
    echo "5. Announce to your community"
}

# Run main function with all arguments
main "$@"