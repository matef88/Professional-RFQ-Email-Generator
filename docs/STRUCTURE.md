# 🗂️ Project Structure

Complete breakdown of the Professional RFQ Email Generator file organization.

---

## Directory Overview

```
Professional-RFQ-Email-Generator/
│
├── 📁 public/                    # Static assets
│   └── index.html               # HTML entry point
│
├── 📁 src/                       # Source code
│   ├── company-details.ts       # ⭐ Company configuration (EDIT THIS)
│   ├── config.ts                # App configuration
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils.ts                 # Utility functions
│   ├── storage.ts               # localStorage service
│   ├── App.tsx                  # Main React component
│   ├── styles.css               # All CSS styling
│   └── index.tsx                # React entry point
│
├── 📁 docs/                      # Documentation
│   ├── USER_GUIDE.md            # How to use the app
│   ├── CODESANDBOX.md           # CodeSandbox setup
│   ├── STRUCTURE.md             # This file
│   ├── CUSTOMIZATION.md         # Customization guide
│   └── THEME.md                 # Theming guide
│
├── .gitignore                    # Git ignore patterns
├── LICENSE                       # MIT License
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project overview
```

---

## File Details

### `/public/index.html`

The HTML entry point. Contains:
- Basic HTML structure
- Root div where React mounts
- Meta tags and title

**Edit?** ❌ No — Leave as-is

---

### `/src/company-details.ts` ⭐

**This is the only file you need to edit.**

Contains all company-specific configuration:
- Company name and branding
- Contact information
- Default links
- Logo settings

```typescript
// Example contents
export const COMPANY_NAME = "Your Company";
export const COMPANY_SHORT_NAME = "YC";
export const COMPANY_TAGLINE = "Your Tagline";
export const COMPANY_EMAIL = "info@company.com";
export const COMPANY_WEBSITE = "https://company.com";
export const COMPANY_PHONE = "+1 555 123 4567";
export const COMPANY_CITY = "City";
export const COMPANY_COUNTRY = "Country";
export const COMPANY_DOCS_LINK = "https://docs.company.com";
```

**Edit?** ✅ **YES** — This is your customization file

---

### `/src/config.ts`

Application configuration that imports from `company-details.ts`:
- Builds the `COMPANY` object
- Defines email templates
- Sets storage limits
- Configures features

**Key Exports:**
- `COMPANY` — Company configuration object
- `TEMPLATES` — Array of email templates
- `APP_CONFIG` — Full app configuration
- `getTemplateById()` — Helper function

**Edit?** ❌ No — Unless adding new templates

---

### `/src/types.ts`

TypeScript type definitions:
- `EmailFormData` — Form data structure
- `Email` — Stored email structure
- `EmailThread` — Thread structure
- `SavedLink` — Saved link structure
- `HistoryEntry` — History log entry
- `Draft` — Auto-saved draft

**Edit?** ❌ No — Unless modifying data structures

---

### `/src/utils.ts`

Utility functions for email generation:
- `buildSubject()` — Generate email subject
- `buildEmailLines()` — Generate email body lines
- `generateEmlContent()` — Create .eml file content
- `generateMailtoUrl()` — Create mailto: URL
- `formatDate()` — Date formatting
- Template content generators

**Edit?** ❌ No — Unless customizing email format

---

### `/src/storage.ts`

localStorage service with CRUD operations:
- `emailStorage` — Email records
- `threadStorage` — Thread management
- `linkStorage` — Saved links
- `historyStorage` — Activity log
- `draftStorage` — Auto-save

**Key Functions:**
- `getAll()` — Get all items
- `getById()` — Get by ID
- `save()` — Save item
- `delete()` — Delete item
- `clear()` — Clear all

**Edit?** ❌ No — Unless changing storage logic

---

### `/src/App.tsx`

Main React component (~1000+ lines):
- Form state management
- Template selection
- Preview generation
- Action handlers (send, copy, download)
- History panel
- Links panel

**Key Sections:**
1. State declarations
2. Form handlers
3. Action handlers
4. Render sections (form, preview, actions)

**Edit?** ❌ No — Unless adding features

---

### `/src/styles.css`

Complete CSS styling:
- CSS variables for theming
- Layout styles
- Component styles
- Responsive breakpoints

**Key Sections:**
```css
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --accent: #3b82f6;
  /* ... more variables */
}
```

**Edit?** ⚠️ Advanced — For theme customization

---

### `/src/index.tsx`

React entry point:
- Renders the App component
- StrictMode wrapper

**Edit?** ❌ No — Leave as-is

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INPUT                                 │
│  (Form fields: template, supplier, package, links, notes)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx (State)                              │
│  • formData: EmailFormData                                      │
│  • Manages all form state                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    utils.ts                                     │
│  • buildSubject(formData) → string                             │
│  • buildEmailLines(formData) → string[]                        │
│  • generateMailtoUrl() → URL                                   │
│  • generateEmlContent() → .eml content                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT                                       │
│  • Preview panel (live)                                         │
│  • Email client (via mailto:)                                   │
│  • Clipboard (copy)                                             │
│  • File download (.txt, .eml)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    storage.ts                                   │
│  • Save to localStorage                                         │
│  • Email history                                                │
│  • Saved links                                                  │
│  • Drafts                                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
App (App.tsx)
│
├── Header
│   ├── Logo
│   ├── Company Name
│   └── Actions (Export, Reset)
│
├── Tab Navigation
│   ├── Compose Tab
│   ├── History Tab
│   └── Links Tab
│
├── Compose Panel
│   ├── Template Selector
│   ├── Recipient Fields
│   │   ├── Supplier Name
│   │   ├── Email(s)
│   │   └── CC
│   ├── Package Fields
│   │   ├── Package Name
│   │   ├── Reference Number
│   │   └── Deadline
│   ├── Link Fields
│   │   ├── Package Link
│   │   └── Company Docs Link
│   └── Notes Field
│
├── Preview Panel
│   ├── Subject Line
│   ├── Email Body
│   └── Thread Info (if follow-up)
│
├── Action Bar
│   ├── Send Email Button
│   ├── Copy Buttons
│   └── Download Buttons
│
├── History Panel (modal/tab)
│   ├── Search
│   ├── Email List
│   └── Email Detail View
│
└── Links Panel (modal/tab)
    ├── Search
    ├── Link List
    └── Add Link Form
```

---

## Configuration Files

### `package.json`

NPM configuration:
- Project metadata
- Dependencies
- Scripts (`start`, `build`, `test`)

```json
{
  "name": "automail-v2",
  "version": "2.0.0",
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

### `tsconfig.json`

TypeScript configuration:
- Target: ES5
- JSX: react-jsx
- Strict mode: enabled

---

## What to Edit Summary

| File | Edit? | Purpose |
|------|-------|---------|
| `company-details.ts` | ✅ **YES** | Your company info |
| `config.ts` | ⚠️ Advanced | Templates, limits |
| `types.ts` | ❌ No | Type definitions |
| `utils.ts` | ❌ No | Email generation |
| `storage.ts` | ❌ No | Data persistence |
| `App.tsx` | ❌ No | Main application |
| `styles.css` | ⚠️ Advanced | Colors, fonts |
| `index.tsx` | ❌ No | Entry point |

---

## Extending the Project

### Adding a New Template

1. Edit `config.ts`:
```typescript
export const TEMPLATES: TemplateConfig[] = [
  // ... existing templates
  {
    id: "custom",
    name: "Custom",
    icon: "🎯",
    color: "#hexcolor",
    description: "Custom template description",
  },
];
```

2. Edit `utils.ts`:
```typescript
// Add case in getTemplateContent()
case "custom":
  return [
    "Custom email content...",
    // ...
  ];
```

### Adding a New Field

1. Edit `types.ts`:
```typescript
export interface EmailFormData {
  // ... existing fields
  newField: string;
}
```

2. Edit `App.tsx`:
- Add state for new field
- Add form input
- Pass to preview/submit

3. Edit `utils.ts`:
- Include in email generation

---

## Next Steps

- 📖 [Customization Guide](CUSTOMIZATION.md) — Detailed customization
- 📖 [Theme Guide](THEME.md) — Change colors and styling
- 📖 [User Guide](USER_GUIDE.md) — How to use the app
