#!/bin/bash

# STL Platform - Local Migration Setup Script
# Run this script locally before deploying to Render

echo "🔧 Setting up PostgreSQL migrations for Render deployment..."
echo ""

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed or not in PATH"
    echo "📝 You can still create migrations using a PostgreSQL connection string"
    echo ""
fi

# Backup current schema
echo "📋 Current database provider in schema.prisma:"
grep "provider" prisma/schema.prisma

echo ""
echo "🔄 Steps to create migrations:"
echo ""
echo "1. Make sure schema.prisma uses PostgreSQL (already configured)"
echo "2. Set up a local PostgreSQL database or use a cloud instance"
echo "3. Update DATABASE_URL in .env to point to PostgreSQL:"
echo "   DATABASE_URL=\"postgresql://user:password@localhost:5432/stl_dev\""
echo ""
echo "4. Create initial migration:"
echo "   npx prisma migrate dev --name init"
echo ""
echo "5. This will create prisma/migrations folder with SQL files"
echo "6. Commit the migrations folder to Git"
echo ""
echo "📌 Alternative: Use Render's PostgreSQL for migration creation:"
echo "   1. Deploy to Render first (migrations will fail)"
echo "   2. Get DATABASE_URL from Render dashboard"
echo "   3. Run migrations locally with Render's DATABASE_URL"
echo "   4. Push migrations to Git and redeploy"
echo ""
echo "✅ After migrations are created, you can deploy to Render!"
