# 🚀 Production Deployment Guide

## 📋 Prerequisites Checklist

Before deploying, make sure you have:

- [ ] Domain name purchased
- [ ] Supabase project created
- [ ] eSewa merchant account (for payments)
- [ ] GitHub account
- [ ] Netlify/Vercel account

---

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project: `khelkheleko-prod`
4. Choose region: `Southeast Asia (Singapore)`
5. Set strong database password

### 1.2 Get Your Credentials
```bash
# You'll need these from your Supabase dashboard:
SUPABASE_URL: https://your-project.supabase.co
SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Set Up Database Schema
1. Go to SQL Editor in Supabase
2. Run the database setup script (I'll provide this)
3. Enable Row Level Security
4. Set up authentication

---

## 🌐 Step 2: Deploy to Netlify (Recommended)

### 2.1 Connect GitHub Repository
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Connect your GitHub repository

### 2.2 Configure Build Settings
```bash
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 2.3 Set Environment Variables
In Netlify dashboard → Site settings → Environment variables:
```bash
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key
VITE_APP_ENV=production
```

### 2.4 Build Settings (Important!)
Make sure these settings are correct in Netlify:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `18`
- **Environment variables:** Set the VITE_ variables above

### 2.4 Custom Domain Setup
1. Go to Domain settings
2. Add custom domain: `khelkheleko.com`
3. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5
   ```

---

## 🔄 Alternative: Deploy to Vercel

### 2.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 2.2 Deploy
```bash
vercel --prod
```

### 2.3 Set Environment Variables
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## 💳 Step 3: Payment Integration (eSewa)

### 3.1 Get eSewa Merchant Account
1. Visit [esewa.com.np](https://esewa.com.np)
2. Apply for merchant account
3. Get production credentials:
   - Merchant ID
   - Secret Key

### 3.2 Update Payment Configuration
```bash
# Add to environment variables:
VITE_ESEWA_MERCHANT_ID=your-merchant-id
VITE_ESEWA_SECRET_KEY=your-secret-key
VITE_ESEWA_BASE_URL=https://epay.esewa.com.np/api/epay/main/v2/form
```

---

## 📊 Step 4: Analytics & Monitoring

### 4.1 Google Analytics (Optional)
1. Create GA4 property
2. Add tracking ID to environment variables
3. Implement tracking code

### 4.2 Error Monitoring
1. Set up Sentry for error tracking
2. Configure performance monitoring
3. Set up alerts

---

## 🔒 Step 5: Security & Performance

### 5.1 SSL Certificate
- Automatically handled by Netlify/Vercel
- Verify HTTPS is working

### 5.2 Performance Optimization
- Enable Gzip compression
- Set up CDN
- Optimize images
- Enable caching headers

---

## 🧪 Step 6: Testing

### 6.1 Pre-deployment Checklist
- [ ] All features work in production
- [ ] Payments are working
- [ ] Database connections are secure
- [ ] Mobile responsiveness
- [ ] Performance is acceptable

### 6.2 User Acceptance Testing
- [ ] Test user registration
- [ ] Test tournament creation
- [ ] Test payment flow
- [ ] Test on different devices

---

## 📈 Step 7: Launch Strategy

### 7.1 Soft Launch
1. Deploy to production
2. Test with small group of users
3. Fix any issues
4. Monitor performance

### 7.2 Public Launch
1. Announce on social media
2. Reach out to sports communities
3. Contact local sports organizations
4. Monitor user feedback

---

## 💰 Cost Breakdown

### Monthly Costs:
```
Domain (.com): $1/month
Netlify Pro: $19/month (optional)
Supabase Pro: $25/month (after free tier)
Total: $45/month for professional setup
```

### Free Tier Limits:
```
Netlify: 100GB bandwidth, 300 build minutes
Supabase: 50,000 monthly active users
Vercel: 100GB bandwidth
```

---

## 🆘 Troubleshooting

### Common Issues:
1. **Build fails**: Check Node version and dependencies
2. **Environment variables not working**: Verify variable names
3. **Database connection fails**: Check Supabase credentials
4. **Payment not working**: Verify eSewa configuration

### Support Resources:
- Netlify Support: [netlify.com/support](https://netlify.com/support)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- eSewa Integration: [developer.esewa.com.np](https://developer.esewa.com.np)

---

## 🎯 Next Steps After Deployment

1. **Monitor Performance**: Set up analytics and monitoring
2. **Gather Feedback**: Collect user feedback and iterate
3. **Scale Infrastructure**: Upgrade plans as user base grows
4. **Add Features**: Implement advanced features based on user needs
5. **Marketing**: Promote your platform to sports communities

---

**Ready to deploy? Follow these steps and you'll have a production-ready sports tournament platform! 🏆**