# 🚀 Render Backend Deployment Guide

## Current Status

✅ All code fixes pushed to GitHub (commit: d470d30a)
✅ Health check endpoint ready at `/api/health`
✅ Render Blueprint configured (`render-backend.yaml`)
⏳ Ready to deploy backend on Render

---

## Step 1: Deploy to Render using Blueprint

### Option A: Deploy via Render Dashboard (Recommended)

1. **Go to Render Dashboard:**
   https://dashboard.render.com

2. **Create New Blueprint:**
   - Click "New +" → "Blueprint"
   - Connect your GitHub account if not already connected
   - Select repository: `clonscorpiona-creator/stl`
   - Branch: `master`
   - Render will automatically detect `render-backend.yaml`

3. **Review Services:**
   Render will create 2 services:
   - `stl-api` - Web Service (Node.js backend)
   - `stl-db` - PostgreSQL Database

4. **Set Environment Variables:**
   The Blueprint will prompt for these variables (marked as `sync: false`):

   ```
   RESEND_API_KEY=your_resend_api_key_here
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   ALLOWED_ORIGINS=https://stl-platform.pages.dev,https://*.stl-platform.pages.dev
   ```

5. **Click "Apply"**
   - Render will create the database first
   - Then deploy the backend service
   - Build process will run: `npm install && prisma generate && prisma migrate deploy && npm run build:backend`

### Option B: Deploy via Render CLI

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy Blueprint
render blueprint launch
```

---

## Step 2: Monitor Deployment

### Build Process (takes 5-10 minutes):

1. **Database Creation** (~2 min)
   - PostgreSQL instance provisioning
   - Disk allocation (1GB)

2. **Backend Build** (~5-8 min)
   - Installing dependencies
   - Generating Prisma Client
   - Running database migrations
   - Building Next.js

3. **Health Check**
   - Render will ping `/api/health` endpoint
   - Service goes live when health check passes

### Check Build Logs:

- Dashboard → Services → stl-api → Logs
- Watch for errors during build

---

## Step 3: Verify Deployment

### Test Health Endpoint:

```bash
curl https://stl-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "initialized": true,
  "userCount": 0,
  "databaseUrl": "postgresql://...",
  "prismaVersion": "6.10.0"
}
```

### If Health Check Fails:

Check logs for common issues:
- Database connection errors → verify DATABASE_URL is set
- Migration errors → database might need manual initialization
- Build errors → check if all dependencies installed

---

## Step 4: Update Cloudflare Pages Environment Variables

Once backend is deployed, update Cloudflare Pages with the correct API URL:

1. **Cloudflare Dashboard:**
   Workers & Pages → stl-platform → Settings → Environment Variables

2. **Add/Update these variables:**
   ```
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   NEXT_PUBLIC_BASE_URL=https://stl-api.onrender.com
   NODE_ENV=production
   ```

3. **Redeploy frontend:**
   - Go to Deployments tab
   - Click "Retry deployment" on latest build

---

## Expected URLs

- **Frontend:** https://stl-platform.pages.dev
- **Backend API:** https://stl-api.onrender.com
- **Health Check:** https://stl-api.onrender.com/api/health
- **Database:** Internal (accessed via DATABASE_URL)

---

## Troubleshooting

### Build fails with "Module not found"
- Check that all commits are pushed to GitHub
- Verify branch is `master`
- Latest commit should be: d470d30a

### Database connection fails
- Check DATABASE_URL in Render dashboard
- Verify database service is running
- Check if migrations ran successfully

### Health check timeout
- Build might still be running (wait 5-10 min)
- Check logs for startup errors
- Verify port 3000 is used (Next.js default)

---

## Next Steps After Successful Deployment

1. ✅ Verify health endpoint responds
2. ✅ Test API routes (e.g., `/api/artists`)
3. ✅ Update Cloudflare Pages env vars
4. ✅ Redeploy frontend
5. ✅ Test full integration (frontend → backend)

---

**Ready to deploy!** 🎯
