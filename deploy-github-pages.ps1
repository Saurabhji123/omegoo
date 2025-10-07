# GitHub Pages Deployment Script for Omegoo (PowerShell)

Write-Host "🚀 Starting GitHub Pages Deployment..." -ForegroundColor Green

# Copy build files to root directory
Write-Host "📁 Copying build files..." -ForegroundColor Yellow
Copy-Item "frontend/build/*" -Destination "." -Recurse -Force
Copy-Item "frontend/build/index.html" -Destination "./index.html" -Force

# Add and commit changes
Write-Host "📤 Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Deploy frontend to GitHub Pages"

# Push to gh-pages branch
Write-Host "🔄 Pushing to gh-pages branch..." -ForegroundColor Yellow
git push origin gh-pages

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your site will be available at: https://saurabhji123.github.io/omegoo" -ForegroundColor Cyan
Write-Host "⏰ GitHub Pages may take 5-10 minutes to update" -ForegroundColor Yellow