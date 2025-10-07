# Dockerfiles for Backend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ src/

# Build application
RUN npm run build

# Expose port (Render will set PORT env variable)
EXPOSE $PORT

# Health check (commented out - curl not available in alpine)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]