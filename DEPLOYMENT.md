# Zapdesk - Deployment Guide

## Option 1: Deploy to Vercel (Recommended - Free & Easy)

### Prerequisites
- GitHub account
- Vercel account (free tier works) - https://vercel.com

### Steps:

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit - Zapdesk Lightning tipping widget"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"
   - Wait 1-2 minutes for deployment

3. **Get your deployment URL**
   - After deployment, you'll get a URL like: `https://your-project.vercel.app`
   - This is your public widget URL

---

## Option 2: Deploy to Netlify (Alternative - Also Free)

### Prerequisites
- GitHub account
- Netlify account (free tier) - https://netlify.com

### Steps:

1. **Push code to GitHub** (same as above)

2. **Deploy to Netlify**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repo
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy"

3. **Configure custom domain (optional)**
   - In Netlify dashboard, go to Domain settings
   - Add custom domain

---

## Option 3: Deploy to Your Own Server

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder contents** to your web server
   - Use FTP, SSH, or your hosting provider's file manager
   - Upload all files from `dist/` to your web root

3. **Configure web server** to allow iframe embedding:
   - Add headers:
     ```
     X-Frame-Options: ALLOWALL
     Content-Security-Policy: frame-ancestors *
     ```

---

## After Deployment: Add to Zendesk Help Center

Once deployed, follow these steps to add the widget to your Help Center:

### Method 1: Add to Request Page (Ticket View)

1. Go to **Zendesk Admin Center**
2. Navigate to **Help Center → Customize Design**
3. Click **Customize** on your active theme
4. In the theme editor, open the **Request page** template (usually `requests.hbs`)
5. Add this code where you want the widget to appear:

```html
<div class="zapdesk-widget-container">
  <iframe
    src="https://YOUR-DEPLOYED-URL.vercel.app"
    width="100%"
    height="750px"
    frameborder="0"
    id="zapdesk-widget"
    title="Lightning Tip Widget"
  ></iframe>
</div>
```

6. Click **Publish** to save changes

### Method 2: Add to All Pages (Global)

Add the iframe to the theme's `footer.hbs` template if you want it to appear everywhere.

### Method 3: Add as Custom Widget

In your theme's script section, you can dynamically load it:

```javascript
<script>
  // Only show on ticket pages
  if (window.location.pathname.includes('/requests/')) {
    var container = document.querySelector('.request-container');
    var iframe = document.createElement('iframe');
    iframe.src = 'https://YOUR-DEPLOYED-URL.vercel.app';
    iframe.width = '100%';
    iframe.height = '750px';
    iframe.frameBorder = '0';
    container.appendChild(iframe);
  }
</script>
```

---

## Configuration

### Updating the Lightning Address

To change the Lightning address for receiving tips:

1. Edit `src/App.jsx`
2. Update line 5:
   ```javascript
   const LIGHTNING_ADDRESS = 'your-address@walletofsatoshi.com'
   ```
3. Rebuild and redeploy:
   ```bash
   npm run build
   git add .
   git commit -m "Update Lightning address"
   git push
   ```

Vercel/Netlify will automatically redeploy.

---

## Troubleshooting

### Widget not loading in Help Center
- Check browser console for errors
- Verify the deployed URL is accessible
- Check CORS/iframe headers are properly set

### QR code not generating
- Check browser console for API errors
- Verify the Lightning address is valid
- Test the widget directly at your deployed URL first

### "Zendesk client not initialized" error
- This is normal when testing outside Zendesk
- The widget will work correctly when embedded in Help Center

---

## Next Steps

1. Deploy the app using one of the methods above
2. Add the iframe code to your Zendesk Help Center
3. Test by creating a support ticket and viewing the request page
4. Share with customers!

For questions or support, contact: support@knowall.ai
