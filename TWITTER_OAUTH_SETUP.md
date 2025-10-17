# Twitter OAuth Setup - Detailed Guide

## 🐦 Step-by-Step Twitter Authentication Setup

### 1. Create Twitter Developer Account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Apply for developer access (if not already approved)
4. Wait for approval (usually instant for basic access)

### 2. Create Twitter App
1. Go to [Developer Dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click **"Create App"** or **"+ Create App"**
3. Fill in app details:
   - **App Name**: `Orca Network` (or your preferred name)
   - **Description**: `AI Agent Network Dashboard with OAuth authentication`
   - **Website URL**: `http://localhost:3000` (for development)
   - **Tell us how this app will be used**: Describe your use case

### 3. Configure OAuth Settings
1. **Go to App Settings**: Click on your created app
2. **Navigate to "App Settings"** tab
3. **Click "Set up" under User authentication settings**
4. **Configure OAuth 1.0a**:
   - ✅ **Enable 3-legged OAuth**
   - ✅ **Request email from users** (optional but recommended)
   
5. **App permissions**:
   - Select **"Read"** (minimum required)
   - Or **"Read and write"** if you need posting capabilities

6. **Callback URLs**:
   ```
   https://kkuzsmeykwseierdeagd.supabase.co/auth/v1/callback
   ```
   
7. **Website URL**: 
   ```
   http://localhost:3000
   ```
   (Update to your production domain later)

### 4. Get API Keys
1. **Go to "Keys and tokens" tab**
2. **Copy these credentials**:
   - **API Key** (this is your Client ID)
   - **API Key Secret** (this is your Client Secret)
   - **Bearer Token** (not needed for OAuth)

### 5. Add to Supabase Dashboard
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Authentication > Providers**
3. **Enable Twitter provider**
4. **Add credentials**:
   - **Client ID**: Paste your **API Key**
   - **Client Secret**: Paste your **API Key Secret**
5. **Save changes**

### 6. Important Twitter OAuth Notes

#### ⚠️ Twitter OAuth Limitations
- **Email Access**: Twitter doesn't always provide email addresses
- **OAuth 1.0a**: Twitter uses older OAuth standard (not OAuth 2.0)
- **Rate Limits**: Twitter has strict API rate limits

#### 🔧 Callback URL Requirements
- Must be **HTTPS** in production
- Must match exactly what's configured in Twitter app
- For development: `http://localhost:3000` is allowed

#### 📧 Email Handling
If Twitter doesn't provide email:
```javascript
// In your app, handle missing email
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'twitter',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
})
```

### 7. Testing Twitter OAuth
1. **Start your app**: `npm run dev`
2. **Go to login page**: `http://localhost:3000/auth/login`
3. **Click Twitter button**
4. **Authorize on Twitter**
5. **Should redirect back to your app**

### 8. Production Setup
When deploying to production:
1. **Update callback URL** in Twitter app settings
2. **Update website URL** to your production domain
3. **Add production domain** to Supabase allowed origins

### 9. Troubleshooting

#### Common Issues:
- **"Callback URL not approved"**: Check exact URL match
- **"Invalid API key"**: Verify Client ID/Secret in Supabase
- **"App not approved"**: Ensure Twitter app is approved
- **Missing email**: Twitter may not provide email address

#### Debug Steps:
1. Check Supabase logs in dashboard
2. Verify callback URL matches exactly
3. Ensure Twitter app is in "Production" mode if needed
4. Check browser network tab for error details

### 10. Example Configuration

**Twitter App Settings:**
```
App Name: Orca Network
Description: AI Agent Network Dashboard
Website: https://your-domain.com
Callback URL: https://kkuzsmeykwseierdeagd.supabase.co/auth/v1/callback
Permissions: Read
OAuth 1.0a: Enabled
```

**Supabase Provider Settings:**
```
Provider: Twitter
Enabled: ✅
Client ID: your_twitter_api_key
Client Secret: your_twitter_api_secret
```

## ✅ Verification
After setup, users should be able to:
1. Click "Twitter" button on login page
2. Get redirected to Twitter authorization
3. Authorize your app
4. Get redirected back and logged in
5. See their Twitter profile info in your app