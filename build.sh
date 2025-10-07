#!/bin/bash
# Simple build script for Render
echo "Starting backend build..."
cd backend
npm install
npm run build
echo "Build complete!"