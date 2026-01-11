# Aetheron GitHub Pages

Live demo: https://mastatrill.github.io/Aetheron/

## Available Pages

- **Home**: [https://mastatrill.github.io/Aetheron/](https://mastatrill.github.io/Aetheron/)
- **Admin Dashboard**: [https://mastatrill.github.io/Aetheron/admin-dashboard.html](https://mastatrill.github.io/Aetheron/admin-dashboard.html)
- **Analytics Dashboard**: [https://mastatrill.github.io/Aetheron/analytics-dashboard.html](https://mastatrill.github.io/Aetheron/analytics-dashboard.html)
- **Block Explorer**: [https://mastatrill.github.io/Aetheron/explorer.html](https://mastatrill.github.io/Aetheron/explorer.html)
- **Features Demo**: [https://mastatrill.github.io/Aetheron/DEMO.html](https://mastatrill.github.io/Aetheron/DEMO.html)
- **Browser Wallet**: [https://mastatrill.github.io/Aetheron/browser-extension/popup.html](https://mastatrill.github.io/Aetheron/browser-extension/popup.html)

## Setup Instructions

1. **Enable GitHub Pages**:

   - Go to your repository settings on GitHub
   - Navigate to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Choose `main` branch and `/ (root)` folder
   - Click "Save"

2. **Wait for Deployment**:

   - GitHub will automatically build and deploy your site
   - This usually takes 1-3 minutes
   - You'll see a green checkmark when deployment is complete

3. **Access Your Site**:
   - Your site will be available at: `https://mastatrill.github.io/Aetheron/`
   - All HTML pages will be accessible via their relative paths

## Notes

- The `.nojekyll` file ensures all files (including those starting with `_`) are served
- The `index.html` serves as the landing page with navigation to all features
- Some features requiring backend API (Block Explorer) will show a message when the server isn't running
- For full functionality including API calls, run the server locally with `npm start`

## Local Development

To test the pages locally with full backend functionality:

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open http://localhost:3000/ in your browser
```

## Updating the Site

Any changes pushed to the `main` branch will automatically update the GitHub Pages site within a few minutes.
