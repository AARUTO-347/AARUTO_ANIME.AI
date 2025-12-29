# AARUTO_ANIME.AI – Netlify Deployment Guide

## Prerequisites
- Node.js 20+ installed locally
- Netlify account (free tier available)
- GitHub repository with this codebase

## Step 1: Prepare Environment Variables
Create a `.env` file in the project root:
```
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Step 2: Test Build Locally
```bash
npm install
npm run build
npm run preview
```
Verify the `dist/` folder is created and the app runs correctly.

## Step 3: Connect to Netlify

### Option A: GitHub Integration (Recommended)
1. Push this repo to GitHub
2. Go to [netlify.com](https://app.netlify.com)
3. Click **"New site from Git"**
4. Select GitHub and authorize
5. Choose your repository
6. Build settings should auto-detect:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
7. Add environment variables in Netlify UI:
   - Go to **Site Settings** → **Build & Deploy** → **Environment**
   - Add `VITE_GEMINI_API_KEY` with your API key
8. Deploy

### Option B: Manual Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

## Step 4: Post-Deployment
- Update Firebase/Gemini API keys in Netlify environment variables if needed
- Test all auth flows (login, signup, logout) at your live URL
- Check browser console for any errors
- Verify count increments work correctly

## Important Notes
- ✅ SPA redirects are configured (`netlify.toml`)
- ✅ Security headers enabled
- ✅ Asset caching optimized
- ✅ Node version pinned to 20.11.1
- Make sure `VITE_GEMINI_API_KEY` is set in Netlify environment before deploying
- Firebase rules should allow read/write for `visitor_count/value` path

## Troubleshooting
- **Build fails:** Check Node version matches (`npm --version`)
- **API errors:** Verify `VITE_GEMINI_API_KEY` is correctly set
- **Routes not working:** `netlify.toml` handles SPA routing
- **Blank page:** Check browser console for 404/CORS errors

---
**Your site is ready for production!** 🚀
