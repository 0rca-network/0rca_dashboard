# OAuth Setup Guide

## 🔧 Configuration Steps

### 1. Get OAuth Credentials

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add redirect URI: `https://kkuzsmeykwseierdeagd.supabase.co/auth/v1/callback`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create New OAuth App
3. Set callback URL: `https://kkuzsmeykwseierdeagd.supabase.co/auth/v1/callback`

#### Twitter OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create App
3. Enable 3-legged OAuth
4. Set callback URL: `https://kkuzsmeykwseierdeagd.supabase.co/auth/v1/callback`

### 2. Add to Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to Authentication > Providers
3. Enable and configure each provider:
   - **Google**: Add Client ID and Client Secret
   - **GitHub**: Add Client ID and Client Secret
   - **Twitter**: Add API Key (as Client ID) and API Secret (as Client Secret)

### 3. Environment Variables (Optional)

If you need the credentials in your app, uncomment and fill in `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Twitter OAuth
TWITTER_CLIENT_ID=your_twitter_api_key_here
TWITTER_CLIENT_SECRET=your_twitter_api_secret_here
```

## ✅ Testing

After setup, test OAuth login at: `http://localhost:3000/auth/login`

## 🚀 Production

Update redirect URIs to your production domain when deploying.