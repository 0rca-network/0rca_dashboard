# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **Supabase Project** set up with all tables created
2. **Groq API Key** for AI chat functionality
3. **GitHub Repository** connected to Vercel or GitHub Actions

## Environment Variables

Set these in your deployment platform (Vercel/GitHub Secrets):

### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GROQ_API_KEY=your-groq-api-key
```

### Optional Variables
```
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
JWT_SECRET=your-jwt-secret
```

## Vercel Deployment

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Settings > Environment Variables
4. Deploy

## GitHub Actions Deployment

1. Add secrets to your GitHub repository:
   - Go to Settings > Secrets and variables > Actions
   - Add all required environment variables as secrets

2. Push to main branch to trigger deployment:
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Check database connections
- [ ] Test AI chat functionality
- [ ] Verify API routes are working
- [ ] Check for console errors

## Troubleshooting

### Build Fails

1. Check environment variables are set correctly
2. Verify Supabase credentials
3. Ensure GROQ_API_KEY is valid
4. Check build logs for specific errors

### Runtime Errors

1. Check browser console for errors
2. Verify Supabase RLS policies are set up
3. Ensure database tables exist
4. Check API route responses

### Database Issues

1. Run the SQL schema from README.md
2. Verify RLS policies are enabled
3. Check table permissions
4. Ensure trigger functions are created

## Support

For issues, check:
- Build logs in Vercel/GitHub Actions
- Browser console errors
- Supabase logs
- API route responses
