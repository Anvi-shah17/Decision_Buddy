# Deploying Decision Buddy to Render

This guide will help you deploy your Decision Buddy application to Render.

## Prerequisites

1. A GitHub account with your code pushed to a repository
2. A Render account (free tier available)
3. Claude API key (optional, for AI features)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com) and sign up/log in
   - Click "New +" and select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Set Environment Variables**
   - In the Render dashboard, go to your backend service
   - Navigate to "Environment" tab
   - Add: `CLAUDE_API_KEY` = your_actual_api_key

### Option 2: Manual Setup

#### Backend Setup
1. **Create Web Service**
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Build Command**: `cd backend && pip install -r requirements.txt`
     - **Start Command**: `cd backend && python app.py`
     - **Root Directory**: Leave blank or set to `backend`
     - **Health Check Path**: `/health`

2. **Environment Variables**
   - Add `CLAUDE_API_KEY` with your API key
   - `PORT` is automatically set by Render

#### Frontend Setup
1. **Create Static Site**
   - Click "New +" → "Static Site"
   - Connect the same GitHub repo
   - Configure:
     - **Build Command**: `echo "No build needed"`
     - **Publish Directory**: `frontend`
     - **Root Directory**: Leave blank

## Important URLs

After deployment, you'll get:
- Backend: `https://your-backend-name.onrender.com`
- Frontend: `https://your-frontend-name.onrender.com`

## Update Frontend Configuration

The frontend is already configured to automatically detect if it's running locally or in production. No changes needed!

## Troubleshooting

1. **Backend not starting**: Check the logs in Render dashboard
2. **API calls failing**: Verify the backend URL in browser and check CORS settings
3. **Missing dependencies**: Ensure all packages are in `requirements.txt`

## Free Tier Limitations

- Backend services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to paid plan for always-on services

## Custom Domain (Optional)

In Render dashboard:
1. Go to your static site settings
2. Click "Custom Domains"
3. Add your domain and configure DNS

---

Your Decision Buddy app should now be live! 🎉
