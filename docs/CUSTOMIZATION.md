# 🎨 Customization Guide

Complete guide to customizing AutoMail V2 for your company.

---

## Quick Start

The only file you need to edit is **`src/company-details.ts`**.

Open it and change the values:

```typescript
export const COMPANY_NAME = "Your Company Name";
export const COMPANY_SHORT_NAME = "YC";
```

Save the file and the app reloads automatically.

---

## Company Details Reference

### Basic Information

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `COMPANY_NAME` | string | `"Acme Construction LLC"` | Full company name |
| `COMPANY_SHORT_NAME` | string | `"AC"` | Abbreviation (1-3 chars) for logo |
| `COMPANY_TAGLINE` | string | `"Quality Building Solutions"` | Slogan displayed under logo |
| `COMPANY_EMAIL` | string | `"procurement@acme.com"` | Contact email for RFQs |
| `COMPANY_WEBSITE` | string | `"https://acme.com"` | Company website URL |
| `COMPANY_PHONE` | string | `"+1 555 123 4567"` | Contact phone number |
| `COMPANY_CITY` | string | `"Houston"` | City location |
| `COMPANY_COUNTRY` | string | `"United States"` | Country location |

### Links

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `COMPANY_DOCS_LINK` | string | `"https://acme.sharepoint.com/docs"` | Pre-filled docs link |

### Branding

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `LOGO_TYPE` | string | `"initials"` | Logo display type |
| `LOGO_IMAGE_URL` | string | `"/logo.png"` | Logo image URL |
| `BRAND_COLOR` | string | `"#3b82f6"` | Primary brand color (hex) |

### Signature

| Variable | Type | Description |
|----------|------|-------------|
| `CUSTOM_SIGNATURE` | string | Custom email signature (leave empty for default) |

### Defaults

| Variable | Type | Description |
|----------|------|-------------|
| `DEFAULTS.deadlineDays` | number | Default deadline in days from today |
| `DEFAULTS.ccEmails` | string | Default CC recipients |
| `DEFAULTS.notes` | string | Default notes text |

---

## Detailed Configuration

### Company Name

Your company's full legal or trading name. This appears in:
- App header
- Email subject lines
- Email signature

```typescript
export const COMPANY_NAME = "Acme Construction LLC";
```

### Short Name

Abbreviation used for:
- Logo badge (when `LOGO_TYPE` is "initials")
- Subject line prefix

Keep it 1-3 characters for best appearance.

```typescript
export const COMPANY_SHORT_NAME = "AC";  // Good
export const COMPANY_SHORT_NAME = "ACME"; // OK but might be cramped
```

### Tagline

A brief slogan or description. Displayed under the logo in the app header.

```typescript
export const COMPANY_TAGLINE = "Premium Fit-Out & Technical Solutions";
```

### Contact Information

These appear in the email signature:

```typescript
export const COMPANY_EMAIL = "procurement@acme.com";
export const COMPANY_PHONE = "+1 555 123 4567";
export const COMPANY_WEBSITE = "https://acme.com";
```

### Location

Used in the email signature:

```typescript
export const COMPANY_CITY = "Houston";
export const COMPANY_COUNTRY = "United States";
```

Result in signature: `Houston, United States`

---

## Logo Configuration

### Option 1: Initials Badge (Default)

Shows the `COMPANY_SHORT_NAME` as a styled badge:

```typescript
export const LOGO_TYPE = "initials";
export const COMPANY_SHORT_NAME = "AC";
export const BRAND_COLOR = "#3b82f6";
```

### Option 2: Custom Image

Use your own logo image:

```typescript
export const LOGO_TYPE = "image";
export const LOGO_IMAGE_URL = "/logo.png";
```

**To add your logo:**
1. Place `logo.png` in the `public/` folder
2. Set `LOGO_IMAGE_URL = "/logo.png"`
3. Recommended size: 40x40 pixels

**Or use an external URL:**
```typescript
export const LOGO_IMAGE_URL = "https://company.com/logo.png";
```

### Option 3: No Logo

```typescript
export const LOGO_TYPE = "none";
```

---

## Brand Color

The primary accent color used throughout the app:

```typescript
export const BRAND_COLOR = "#3b82f6";  // Blue
```

**Popular Colors:**

| Color | Hex Code |
|-------|----------|
| Blue | `#3b82f6` |
| Green | `#10b981` |
| Purple | `#8b5cf6` |
| Red | `#ef4444` |
| Orange | `#f97316` |
| Teal | `#14b8a6` |
| Pink | `#ec4899` |
| Indigo | `#6366f1` |

---

## Company Documents Link

A pre-filled link to your company documents folder. This saves time when composing emails.

Typically contains:
- Company registration documents
- Certificates and licenses
- Terms and conditions
- Insurance documents

```typescript
export const COMPANY_DOCS_LINK = "https://acme.sharepoint.com/company-docs";
```

Leave empty if not needed:
```typescript
export const COMPANY_DOCS_LINK = "";
```

---

## Custom Email Signature

By default, the signature is generated from your company details:

```
Best regards,

Acme Construction LLC
Quality Building Solutions
Houston, United States
```

To use a custom signature:

```typescript
export const CUSTOM_SIGNATURE = `Best regards,

John Smith
Procurement Manager
Acme Construction LLC

Tel: +1 555 123 4567
Email: john@acme.com`;
```

Leave empty to use the default:
```typescript
export const CUSTOM_SIGNATURE = "";
```

---

## Default Values

Pre-fill new emails with default values:

### Default Deadline

Automatically set deadline to X days from today:

```typescript
export const DEFAULTS = {
  deadlineDays: 7,  // Deadline = today + 7 days
  // ...
};
```

Set to `0` to leave deadline empty:
```typescript
deadlineDays: 0,
```

### Default CC Recipients

Pre-fill CC field:

```typescript
export const DEFAULTS = {
  ccEmails: "manager@acme.com, archive@acme.com",
  // ...
};
```

### Default Notes

Pre-fill the notes field:

```typescript
export const DEFAULTS = {
  notes: "Please include delivery timeline in your quotation.",
  // ...
};
```

---

## Complete Example

Here's a complete `company-details.ts` example:

```typescript
/**
 * Company Details Configuration
 */

export const COMPANY_NAME = "Acme Construction LLC";
export const COMPANY_SHORT_NAME = "AC";
export const COMPANY_TAGLINE = "Quality Building Solutions";
export const COMPANY_EMAIL = "procurement@acme.com";
export const COMPANY_WEBSITE = "https://acme.com";
export const COMPANY_PHONE = "+1 555 123 4567";
export const COMPANY_CITY = "Houston";
export const COMPANY_COUNTRY = "United States";

export const LOGO_TYPE: "initials" | "image" | "none" = "initials";
export const LOGO_IMAGE_URL = "";
export const BRAND_COLOR = "#3b82f6";

export const COMPANY_DOCS_LINK = "https://acme.sharepoint.com/docs";

export const CUSTOM_SIGNATURE = "";

export const DEFAULTS = {
  deadlineDays: 7,
  ccEmails: "",
  notes: "",
};
```

---

## Testing Your Changes

After editing `company-details.ts`:

1. **Save the file** (Ctrl+S / Cmd+S)
2. **Check the app header** — Logo and company name should update
3. **Create a test email** — Check the signature
4. **Verify links** — Check the pre-filled company docs link

---

## Troubleshooting

### Changes not appearing?

1. Make sure you saved the file
2. Refresh the browser
3. Check for TypeScript errors in the console

### Logo image not showing?

1. Verify the image URL is correct
2. For local images, ensure they're in `public/`
3. Check image format (PNG, JPG, SVG work best)

### TypeScript errors?

Make sure you're using the correct types:
- `LOGO_TYPE` must be `"initials"`, `"image"`, or `"none"`
- `BRAND_COLOR` must be a valid hex color string
- `DEFAULTS.deadlineDays` must be a number

---

## Advanced Customization

For more advanced customization, see:

- **[THEME.md](THEME.md)** — Change colors, fonts, and layout
- **[STRUCTURE.md](STRUCTURE.md)** — Understand the codebase for deeper changes

---

## Next Steps

1. ✅ Edit `company-details.ts` with your information
2. ✅ Test all templates to verify your signature
3. ✅ Add your logo (optional)
4. ✅ Set default values for your workflow
