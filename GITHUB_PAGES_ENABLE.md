# Enable GitHub Pages - Quick Guide

## Step 1: Enable GitHub Pages in Repository Settings

**IMPORTANT**: You must enable GitHub Pages in your repository settings BEFORE the workflow can run.

1. Go to your repository: https://github.com/jalaparthi1/Project3
2. Click **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - **Deploy from a branch**: Select this option
   - **Branch**: Choose `main` (or `master`)
   - **Folder**: Select `/ (root)`
5. Click **Save**

## Step 2: Wait for Initial Setup

After enabling Pages:
- GitHub will create the Pages environment
- Wait 1-2 minutes for the initial setup
- You may see a message that Pages is being built

## Step 3: The Workflow Will Run Automatically

Once Pages is enabled:
- The workflow will run on every push to `main`
- It will automatically deploy your static files
- Your site will be available at: `https://jalaparthi1.github.io/Project3/`

## Alternative: Manual Deployment (No Workflow Needed)

If you prefer not to use the workflow, you can deploy manually:

1. Enable GitHub Pages (Step 1 above)
2. GitHub will automatically serve files from the `main` branch
3. No workflow needed - it works automatically!

## Troubleshooting

### Error: "Get Pages site failed"
- **Solution**: Enable GitHub Pages in Settings → Pages first (Step 1 above)

### Error: "Not Found"
- **Solution**: Make sure you've enabled Pages and selected the correct branch

### Workflow Not Running
- Check that Pages is enabled in Settings
- Verify the branch name matches (`main` or `master`)
- Check Actions tab to see if workflow is queued

### Site Not Loading
- Wait 2-3 minutes after enabling Pages
- Check the Actions tab for deployment status
- Verify the URL: `https://yourusername.github.io/Project3/`

## After Enabling Pages

Once Pages is enabled, the workflow will:
1. Run automatically on every push
2. Deploy only the necessary files (excludes node_modules, server files, etc.)
3. Make your site live at the GitHub Pages URL

**Note**: The workflow excludes backend files (server/, database/, node_modules/) since GitHub Pages only serves static files.

