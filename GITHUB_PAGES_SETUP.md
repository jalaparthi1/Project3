# GitHub Pages Deployment Guide

This guide will help you deploy the Christmas Fifteen Puzzle to GitHub Pages with full functionality.

## Architecture

Since GitHub Pages only serves static files, we need to:
1. **Frontend**: Deploy to GitHub Pages (this repository)
2. **Backend**: Deploy to a free hosting service (Render, Railway, Heroku, etc.)

## Step 1: Deploy Backend API

### Option A: Deploy to Render (Recommended - Free Tier)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `christmas-puzzle-api` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`
   - **Plan**: Free
5. Add Environment Variables:
   ```
   PORT=10000
   JWT_SECRET=your-super-secret-jwt-key-change-this
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=christmas_puzzle
   ```
6. Click "Create Web Service"
7. Wait for deployment and copy the URL (e.g., `https://christmas-puzzle-api.onrender.com`)

### Option B: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a MySQL database service
5. Set environment variables in the Variables tab
6. Deploy and copy the URL

### Option C: Deploy to Heroku

1. Install Heroku CLI: `brew install heroku/brew/heroku`
2. Login: `heroku login`
3. Create app: `heroku create christmas-puzzle-api`
4. Add MySQL addon: `heroku addons:create cleardb:ignite`
5. Set config vars:
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set DB_HOST=$(heroku config:get CLEARDB_DATABASE_URL | cut -d'/' -f3 | cut -d'@' -f2 | cut -d':' -f1)
   # ... set other DB vars
   ```
6. Deploy: `git push heroku main`
7. Copy the URL: `https://christmas-puzzle-api.herokuapp.com`

## Step 2: Update Frontend Configuration

1. Open `js/config.js`
2. Find the line: `const GITHUB_PAGES_API_URL = 'https://your-backend-app.onrender.com/api';`
3. Replace `https://your-backend-app.onrender.com/api` with your actual backend URL
4. Make sure it ends with `/api`

Example:
```javascript
const GITHUB_PAGES_API_URL = 'https://christmas-puzzle-api.onrender.com/api';
```

## Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Branch**: `main` (or `master`)
   - **Folder**: `/ (root)`
4. Click **Save**
5. Wait a few minutes for GitHub to build and deploy
6. Your site will be available at: `https://yourusername.github.io/Project3/`

## Step 4: Set Up Database

### For Render/Railway/Heroku:

1. Use their built-in database services, OR
2. Use a free MySQL hosting service like:
   - [PlanetScale](https://planetscale.com) (Free tier)
   - [Aiven](https://aiven.io) (Free tier)
   - [Free MySQL Hosting](https://www.freemysqlhosting.net)

2. Update your backend environment variables with the database credentials
3. Run the schema: `mysql -u username -p -h host < database/schema.sql`

## Step 5: Test the Deployment

1. Visit your GitHub Pages URL
2. Try to:
   - Register a new account
   - Login
   - Play a puzzle
   - Submit a score to leaderboard
   - Check story mode

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure your backend has CORS enabled:
```javascript
app.use(cors({
    origin: ['https://yourusername.github.io', 'http://localhost:3000'],
    credentials: true
}));
```

### API Not Working
1. Check browser console for errors
2. Verify the API URL in `js/config.js` is correct
3. Test the backend API directly: `https://your-backend-url/api/leaderboard`
4. Check backend logs for errors

### Database Connection Issues
1. Verify database credentials in environment variables
2. Check if database allows connections from your hosting provider
3. Ensure database schema is set up correctly

## Quick Setup Script

After deploying backend, update this line in `js/config.js`:

```javascript
const GITHUB_PAGES_API_URL = 'YOUR_BACKEND_URL_HERE/api';
```

Then commit and push:
```bash
git add js/config.js
git commit -m "Configure API URL for GitHub Pages"
git push origin main
```

GitHub Pages will automatically rebuild with the new configuration.

## Notes

- GitHub Pages is free and automatically rebuilds on every push
- Backend hosting (Render/Railway) free tiers may have cold starts (first request takes longer)
- Free database tiers may have connection limits
- All features work: authentication, leaderboard, story mode, achievements

