# Quick Start - Deploy Zapdesk to Your Help Center

Your app is built and ready to deploy! Follow these simple steps:

## Step 1: Push to GitHub (5 minutes)

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name it: `zapdesk-helpcenter`
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Push your code**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/zapdesk-helpcenter.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel (5 minutes)

1. **Go to Vercel**
   - Visit https://vercel.com/signup
   - Sign up with GitHub (free)

2. **Import your project**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose `zapdesk-helpcenter` from the list
   - Click "Import"

3. **Deploy**
   - Vercel auto-detects Vite settings
   - Click "Deploy"
   - Wait 2-3 minutes

4. **Copy your URL**
   - After deployment completes, copy your URL
   - It will look like: `https://zapdesk-helpcenter.vercel.app`

## Step 3: Add to Zendesk Help Center (10 minutes)

1. **Go to Zendesk Admin Center**
   - Navigate to: Help Center → Customize Design

2. **Edit your theme**
   - Click "Customize" on your active theme
   - Open the file: `templates/requests.hbs` (or request page template)

3. **Add the widget iframe**
   - Find where you want the tipping widget to appear
   - Paste this code:

   ```html
   <div class="zapdesk-widget">
     <iframe
       src="https://YOUR-PROJECT.vercel.app"
       width="100%"
       height="750px"
       frameborder="0"
       title="Tip Your Agent"
       allow="payment"
     ></iframe>
   </div>
   ```

   Replace `YOUR-PROJECT.vercel.app` with your actual Vercel URL

4. **Optional: Add some styling**
   Add this to your theme's CSS:
   ```css
   .zapdesk-widget {
     margin: 24px 0;
     padding: 20px;
     background: #f8f9fa;
     border-radius: 8px;
   }
   ```

5. **Publish**
   - Click "Publish" to make it live

## Step 4: Test It

1. **Create or open a support ticket** in your Help Center
2. **Go to the request page** (where customers view their tickets)
3. **You should see the Lightning tipping widget!**

---

## What's Next?

### For Each Customer's Lightning Address

Currently, all tips go to: `covertbrian73@walletofsatoshi.com`

To make this configurable per customer, you'll need to:

1. Add a configuration parameter (I can help with this)
2. Allow each Zendesk account to enter their own Lightning address
3. Or create a backend service to route payments

Would you like help implementing any of these?

---

## Troubleshooting

**Widget not showing?**
- Check browser console for errors
- Verify your Vercel URL is accessible
- Make sure the iframe code was added correctly

**QR code not generating?**
- Open your Vercel URL directly in a browser
- Check the console for API errors
- Verify the Lightning address is valid

**Zendesk client error?**
- This is normal when viewing the URL directly
- It should work correctly when embedded in Help Center

---

## Need Help?

- Check the full deployment guide: `DEPLOYMENT.md`
- Email: support@knowall.ai
- Or create an issue on GitHub

🎉 **You're ready to receive Lightning tips from your customers!**
