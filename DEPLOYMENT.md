# 🚀 Free Deployment Guide

This guide will help you deploy your Document Generator to **Vercel (Frontend) + Render (Backend)** for FREE!

## 📋 Prerequisites

1. GitHub account
2. Vercel account (free)
3. Render account (free)
4. Your API key for the LLM (Anthropic Claude)

## 🔧 Backend Deployment (Render)

### Step 1: Set Up Environment Variables Locally
```bash
# Copy environment templates
cp .env.example docgen/.env
cp frontend/.env.example frontend/.env

# Edit docgen/.env and add your API key:
ANTHROPIC_API_KEY=your-actual-anthropic-api-key-here
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:
   - **Build Command**: `pip install -r requirements.txt && cd docgen && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command**: `cd docgen && daphne -b 0.0.0.0 -p $PORT docgen.asgi:application`
   - **Environment**: `Python 3`

### Step 4: Add Environment Variables
In Render dashboard, add these environment variables:
```
DJANGO_SECRET_KEY=generate-a-new-secret-key-here
DJANGO_DEBUG=False
ANTHROPIC_API_KEY=your-anthropic-api-key
LLM_MODEL_NAME=anthropic:claude-sonnet-4-5
FRONTEND_URL=https://your-vercel-app.vercel.app
ALLOWED_HOSTS=your-render-app.onrender.com
```

### Step 4: Add Database (Optional)
1. In Render dashboard, create a new PostgreSQL database (free)
2. It will automatically set `DATABASE_URL` environment variable

## 🎨 Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory**: `frontend`
5. Framework will auto-detect as Vite

### Step 2: Add Environment Variables
In Vercel dashboard, add these environment variables:
```
VITE_API_URL=https://your-render-app.onrender.com
VITE_WS_URL=wss://your-render-app.onrender.com
VITE_APP_NAME=Document Generator
VITE_USER_ID=user_01
```
Replace `your-render-app` with your actual Render app name.

## 🔗 Final Steps

### 1. Update CORS Settings
Once you have your Vercel URL, update Django settings with your frontend URL:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-vercel-app.vercel.app",
]
```

### 2. Test Your Deployment
1. Visit your Vercel URL
2. Try generating a document
3. Test PDF export functionality

## 🎯 URLs You'll Get

- **Frontend**: `https://your-project-name.vercel.app`
- **Backend**: `https://your-app-name.onrender.com`

## 🆓 Free Tier Limits

**Vercel (Frontend):**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Custom domains

**Render (Backend):**
- ✅ 750 hours/month (enough for 24/7)
- ✅ 512MB RAM
- ✅ Sleeps after 15min inactivity
- ✅ Free PostgreSQL database (1GB)

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `requirements.txt`
2. **WebSocket Connection Failed**: Ensure `wss://` (not `ws://`) for production
3. **CORS Errors**: Add your Vercel domain to `CORS_ALLOWED_ORIGINS`
4. **App Sleeps**: Free tier sleeps after 15min - first request wakes it up

### Debug Steps:
1. Check Render logs for backend errors
2. Check Vercel function logs for frontend issues
3. Use browser dev tools to check network requests

## 🎉 Success!

Your document generator is now live and accessible worldwide for FREE! 

- Share your Vercel URL with users
- Both services auto-deploy when you push to GitHub
- Backend wakes up automatically when accessed

Need help? Check the logs in both Render and Vercel dashboards for any error messages.