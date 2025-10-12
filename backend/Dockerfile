# Ultra-Simple Backend Dockerfile - NO PUBLIC FOLDER REFERENCES
# Timestamp: 2025-10-12-FORCE-REBUILD
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy only source code
COPY src ./src

# Build
RUN npm run build

# Start
CMD ["npm", "start"]