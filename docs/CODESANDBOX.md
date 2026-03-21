# 📦 CodeSandbox Setup Guide

Complete guide to deploying and using AutoMail V2 on CodeSandbox.

---

## What is CodeSandbox?

[CodeSandbox](https://codesandbox.io) is an online code editor that lets you run React applications directly in your browser — no installation required. It's perfect for:

- ✅ Quick setup without installing Node.js
- ✅ Access from any computer with internet
- ✅ Automatic dependency management
- ✅ Instant preview of changes
- ✅ Easy sharing via URL

---

## Quick Setup (5 Minutes)

### Step 1: Create a CodeSandbox Account (Optional but Recommended)

1. Go to [codesandbox.io](https://codesandbox.io)
2. Click **"Sign Up"** (free)
3. Sign up with GitHub, Google, or email

> 💡 **Tip:** With an account, your sandboxes are saved and accessible from any device.

### Step 2: Import the Project

**Option A: Import from GitHub (Recommended)**

1. Fork this repository to your GitHub account
2. In CodeSandbox, click **"Create Sandbox"** (top-right)
3. Select **"Import Project"** → **"Import from GitHub"**
4. Paste the repository URL:
   ```
   https://github.com/matef88/Professional-RFQ-Email-Generator
   ```
5. Click **"Import"**

**Option B: Create Manually**

1. In CodeSandbox, click **"Create Sandbox"**
2. Select **"React TypeScript"** template
3. Delete the default files
4. Upload all files from this project (or copy-paste content)

### Step 3: Wait for Dependencies

CodeSandbox automatically:
- Detects `package.json`
- Installs all dependencies
- Starts the development server

You'll see a loading indicator, then the app appears in the preview pane.

### Step 4: Customize Your Company Details

1. In the file tree (left sidebar), find **`src/company-details.ts`**
2. Click to open it
3. Edit the values:

```typescript
export const COMPANY_NAME = "Your Company Name";
export const COMPANY_SHORT_NAME = "YC";
export const COMPANY_TAGLINE = "Your Tagline";
export const COMPANY_EMAIL = "procurement@yourcompany.com";
// ... etc
```

4. Press **Ctrl+S** (or **Cmd+S** on Mac) to save
5. The preview reloads automatically with your changes

### Step 5: Start Using the App

You're ready! The app is now running with your company details.

---

## CodeSandbox Interface

```
┌─────────────────────────────────────────────────────────────────────┐
│  MENU BAR: File, Edit, View, etc.                    [Share] [Fork]│
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                    │
│   FILE TREE    │              CODE EDITOR                           │
│                │                                                    │
│  📁 public/    │    (Edit your code here)                          │
│  📁 src/       │                                                    │
│    📄 App.tsx  │                                                    │
│    📄 config.ts│                                                    │
│    📄 ...      │                                                    │
│    ⭐ company- │                                                    │
│       details.ts (EDIT THIS!)                                       │
│                ├────────────────────────────────────────────────────┤
│                │                                                    │
│   DEPENDENCIES │              PREVIEW / BROWSER                     │
│                │                                                    │
│  📦 react      │    (Your app runs here)                           │
│  📦 typescript │                                                    │
│  📦 ...        │                                                    │
│                │                                                    │
└────────────────┴────────────────────────────────────────────────────┘
```

---

## Important Files to Know

| File | Edit? | Purpose |
|------|-------|---------|
| `src/company-details.ts` | ✅ **YES** | Your company information |
| `src/config.ts` | ❌ No | App configuration (uses company-details) |
| `src/App.tsx` | ❌ No | Main application code |
| `src/styles.css` | ⚠️ Advanced | Colors and styling |
| `package.json` | ❌ No | Dependencies |

> ⚠️ **Important:** Only edit `company-details.ts` unless you're comfortable with React/TypeScript.

---

## Saving Your Work

### Auto-Save

CodeSandbox automatically saves your changes as you type. No manual save needed.

### Persistent Storage

Your sandbox is stored on CodeSandbox's servers. It persists across sessions.

### Best Practice: Fork to Your Account

If you're using a shared sandbox:
1. Click **"Fork"** (top-right)
2. This creates your own copy
3. Your changes won't affect the original

---

## Using the App in CodeSandbox

### Opening the App Full-Screen

1. Hover over the preview pane
2. Click the **pop-out icon** (top-right of preview)
3. The app opens in a new tab at full size

### Sharing the App

**Share for Viewing:**
1. Click **"Share"** (top-right)
2. Copy the **"View Link"**
3. Recipients can use the app but can't edit code

**Share for Editing:**
1. Click **"Share"** (top-right)
2. Copy the **"Edit Link"**
3. Recipients can edit the code (makes a copy)

---

## Data Storage in CodeSandbox

### Where is Data Stored?

Data is stored in the **browser's localStorage**, which means:

- ✅ Data persists across page refreshes
- ✅ Data is private to your browser
- ❌ Data is NOT synced across devices
- ❌ Data is lost if you clear browser data

### Each Sandbox Has Its Own Storage

If you:
- Fork a sandbox → New sandbox, fresh storage
- Open in different browser → Separate storage
- Open in incognito → Temporary storage (lost when closed)

### Backing Up Your Data

Use the **Export** button in the app to download a JSON backup:
1. Click **"Export"** (top-right of the app)
2. A JSON file downloads
3. Store this file safely

---

## Troubleshooting

### "Dependencies failed to install"

1. Click the **"Dependencies"** tab in the left sidebar
2. Click the **refresh icon** to retry
3. If still failing, check `package.json` for errors

### "Preview is blank"

1. Check the **"Console"** tab (bottom panel) for errors
2. Make sure all files are present
3. Try refreshing the preview (refresh icon)

### "Changes aren't showing"

1. Make sure you saved the file (Ctrl+S / Cmd+S)
2. Check for errors in the Console tab
3. Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### "I lost my changes"

If you have a CodeSandbox account:
1. Check **"History"** in the file menu
2. You may be able to recover previous versions

If not, changes may be lost. Always fork important sandboxes to your account.

---

## Tips for CodeSandbox

### ✅ Do

- **Fork to your account** — Ensures you own the sandbox
- **Export data regularly** — Download JSON backups
- **Use the full-screen preview** — Better experience
- **Bookmark your sandbox URL** — Quick access

### ❌ Don't

- **Don't clear browser data** — You'll lose localStorage data
- **Don't rely on one device** — Data doesn't sync
- **Don't edit files you don't understand** — Stick to `company-details.ts`

---

## Deploying to Production

CodeSandbox is great for development, but for production use:

### Option 1: GitHub Pages

1. Push your code to GitHub
2. Go to Settings → Pages
3. Select source branch
4. Your app is live at `https://username.github.io/automail-v2`

### Option 2: Netlify

1. Connect your GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `build`
4. Auto-deploys on every push

### Option 3: Vercel

1. Import your GitHub repo to Vercel
2. Framework: Create React App
3. Deploy with one click

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## Next Steps

1. ✅ Customize `company-details.ts` with your information
2. ✅ Test all templates and features
3. ✅ Export a backup of your data
4. ✅ Bookmark your sandbox URL
5. ✅ Consider deploying to production for team use

---

## Need Help?

- 📖 [User Guide](USER_GUIDE.md) — How to use the app
- 📖 [Customization Guide](CUSTOMIZATION.md) — Detailed customization
- 📖 [Structure Guide](STRUCTURE.md) — Understand the codebase
