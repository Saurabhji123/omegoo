#!/bin/bash

# GitHub Pages Deployment Script for Omegoo

echo "🚀 Starting GitHub Pages Deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Copy build files to root for GitHub Pages
echo "📁 Copying build files..."
cp -r frontend/build/* .
cp frontend/build/index.html ./index.html

# Create CNAME for custom domain (optional)
# echo "omegoo.yourdomain.com" > CNAME

# Git operations
echo "📤 Pushing to gh-pages branch..."
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://saurabhji123.github.io/omegoo"