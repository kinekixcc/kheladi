# 🚀 Deployment Guide

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Nepal Sports Tournament Platform"
```

### 1.2 Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `khelkheleko-nepal-sports`
4. Description: `Nepal Sports Tournament Platform - Find and book sports facilities`
5. Make it **Public** (for free Netlify deployment)
6. Don't initialize with README (we already have one)

### 1.3 Connect and Push
```bash
git remote add origin https://github.com/YOUR_USERNAME/khelkheleko-nepal-sports.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Netlify

### 2.1 Connect GitHub to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Choose "GitHub"
4. Select your repository: `khelkheleko-nepal-sports`

### 2.2 Configure Build Settings
```
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 2.3 Set Environment Variables
In Netlify dashboard → Site settings → Environment variables, add:

**Required Variables:**
```
VITE_SUPABASE_URL = your-actual-supabase-url
VITE_SUPABASE_ANON_KEY = your-actual-supabase-anon-key
```

**Optional Variables:**
```
VITE_APP_ENV = production
VITE_APP_NAME = खेल खेलेको
```

### 2.4 Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Your site will be live at: `https://random-name.netlify.app`

---

## Step 3: Custom Domain (Optional)

### 3.1 Add Custom Domain
1. In Netlify dashboard → Domain settings
2. Click "Add custom domain"
3. Enter your domain: `khelkheleko.com`

### 3.2 Configure DNS
Point your domain to Netlify:
```
Type: CNAME
Name: www
Value: your-site.netlify.app

Type: A
Name: @
Value: 75.2.60.5
```

---

## 🔧 Quick Commands

### Push Updates
```bash
git add .
git commit -m "Update: description of changes"
git push
```

### Force Redeploy
```bash
# Trigger new build on Netlify
git commit --allow-empty -m "Trigger rebuild"
git push
```

---

## ✅ Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify site created and connected
- [ ] Environment variables set
- [ ] Build successful
- [ ] Site is live and accessible
- [ ] Supabase authentication working
- [ ] All features functional

---

## 🆘 Troubleshooting

**Build Fails:**
- Check Node version is 18
- Verify all dependencies are in package.json
- Check for TypeScript errors

**Environment Variables Not Working:**
- Ensure variable names start with `VITE_`
- Redeploy after adding variables
- Check variable values are correct

**Supabase Connection Issues:**
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Ensure RLS policies allow access

Your site will be live at: `https://your-site-name.netlify.app`