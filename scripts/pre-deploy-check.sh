#!/bin/bash

# STL Platform - Pre-deployment Checklist Script

echo "🔍 Running pre-deployment checklist..."
echo ""

# Check 1: Git repository
if [ -d .git ]; then
    echo "✅ Git repository initialized"
else
    echo "❌ Git repository not found - run: git init"
fi

# Check 2: Node modules
if [ -d node_modules ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies not installed - run: npm install"
fi

# Check 3: Prisma schema
if grep -q "provider = \"postgresql\"" prisma/schema.prisma; then
    echo "✅ Prisma configured for PostgreSQL"
else
    echo "❌ Prisma still using SQLite - check schema.prisma"
fi

# Check 4: Migrations folder
if [ -d prisma/migrations ]; then
    echo "✅ Migrations folder exists"
    MIGRATION_COUNT=$(find prisma/migrations -name "migration.sql" | wc -l)
    echo "   Found $MIGRATION_COUNT migration(s)"
else
    echo "⚠️  No migrations folder - you need to create migrations"
    echo "   Run: npx prisma migrate dev --name init"
fi

# Check 5: render.yaml
if [ -f render.yaml ]; then
    echo "✅ render.yaml configuration exists"
else
    echo "❌ render.yaml not found"
fi

# Check 6: Environment variables
if [ -f .env ]; then
    echo "✅ .env file exists"
    if grep -q "DATABASE_URL" .env; then
        echo "   DATABASE_URL is set"
    fi
else
    echo "⚠️  .env file not found - copy from .env.example"
fi

# Check 7: Build test
echo ""
echo "🧪 Testing build process..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "⚠️  Build failed - check for errors"
fi

echo ""
echo "📋 Summary:"
echo "   If all checks pass, you're ready to deploy!"
echo "   Follow instructions in RENDER_QUICKSTART.md"
