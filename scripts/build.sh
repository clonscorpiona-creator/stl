#!/bin/bash

# STL Platform - Deployment Script for Render
# This script prepares the application for deployment

echo "🚀 Preparing STL Platform for Render deployment..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Step 3: Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Step 4: Build Next.js application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
echo "🌐 Application is ready to start with: npm start"
