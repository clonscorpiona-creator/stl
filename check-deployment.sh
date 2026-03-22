#!/bin/bash

# Deployment Status Checker for STL Platform

echo "🔍 Checking STL Platform Deployment Status..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Backend API
echo "📡 Backend API (Render):"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://stl-api.onrender.com/api/health)

if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo "   URL: https://stl-api.onrender.com"

    # Get health check details
    HEALTH=$(curl -s https://stl-api.onrender.com/api/health)
    echo "   Response: $HEALTH"
else
    echo -e "${RED}❌ Backend not accessible (HTTP $BACKEND_STATUS)${NC}"
    echo "   Expected: 200"
    echo "   Action: Create service on Render using render-backend.yaml"
fi

echo ""

# Check Frontend
echo "🌐 Frontend (Cloudflare Pages):"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://stl-platform.pages.dev)

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
    echo "   URL: https://stl-platform.pages.dev"
else
    echo -e "${RED}❌ Frontend not accessible (HTTP $FRONTEND_STATUS)${NC}"
    echo "   Expected: 200"
    echo "   Action: Create project on Cloudflare Pages"
fi

echo ""

# Check Database (if backend is up)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "🗄️  Database:"
    DB_STATUS=$(curl -s https://stl-api.onrender.com/api/stats)

    if [[ $DB_STATUS == *"error"* ]]; then
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "   Response: $DB_STATUS"
    else
        echo -e "${GREEN}✅ Database is connected${NC}"
        echo "   Stats: $DB_STATUS"
    fi
    echo ""
fi

# Summary
echo "📋 Summary:"
if [ "$BACKEND_STATUS" = "200" ] && [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ All systems operational!${NC}"
    echo ""
    echo "🎉 Your platform is live:"
    echo "   Frontend: https://stl-platform.pages.dev"
    echo "   Backend:  https://stl-api.onrender.com"
else
    echo -e "${YELLOW}⚠️  Deployment incomplete${NC}"
    echo ""
    echo "📝 Next steps:"
    if [ "$BACKEND_STATUS" != "200" ]; then
        echo "   1. Deploy backend to Render (see NEXT_STEPS_RU.md)"
    fi
    if [ "$FRONTEND_STATUS" != "200" ]; then
        echo "   2. Deploy frontend to Cloudflare Pages (see NEXT_STEPS_RU.md)"
    fi
fi

echo ""
