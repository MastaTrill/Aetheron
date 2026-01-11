# Multi-stage Docker build for Aetheron Platform
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install build dependencies including SQLite
RUN apk add --no-cache python3 make g++ sqlite-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build application (if needed)
RUN npm run lint || true

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install dumb-init and SQLite runtime
RUN apk add --no-cache dumb-init curl sqlite

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aetheron -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=aetheron:nodejs /app .

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/logs /app/backups && \
    chown -R aetheron:nodejs /app/data /app/logs /app/backups

# Switch to non-root user
USER aetheron

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check with proper endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
