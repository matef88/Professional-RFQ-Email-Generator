# 📖 User Guide

Complete guide to using AutoMail V2 for generating professional RFQ emails.

---

## Table of Contents

1. [Interface Overview](#interface-overview)
2. [Composing an Email](#composing-an-email)
3. [Email Templates](#email-templates)
4. [Sending Options](#sending-options)
5. [Email History](#email-history)
6. [Link Management](#link-management)
7. [Data Management](#data-management)

---

## Interface Overview

AutoMail has a clean, split-panel interface:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo, Company Name, Export/Reset buttons           │
├─────────────────────────────────────────────────────────────┤
│  TABS: Compose | History | Links                            │
├────────────────────────┬────────────────────────────────────┤
│                        │                                    │
│    FORM PANEL          │      PREVIEW PANEL                 │
│    (Left Side)         │      (Right Side)                  │
│                        │                                    │
│  • Template Selection  │   • Live Email Preview             │
│  • Recipient Details   │   • Subject Line                   │
│  • Package Details     │   • Email Body                     │
│  • Links               │   • Thread Info (if follow-up)     │
│  • Notes               │                                    │
│                        │                                    │
├────────────────────────┴────────────────────────────────────┤
│  ACTION BAR: Send Email | Copy | Download                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Composing an Email

### Step 1: Select a Template

Click one of the 6 template buttons at the top of the form:

| Button | Best For |
|--------|----------|
| 📄 **Standard** | Regular RFQ requests |
| ⚡ **Urgent** | Time-sensitive requests with short deadlines |
| 🏆 **Competitive** | Bidding processes with multiple vendors |
| 📦 **Bulk Order** | Large-scale or high-volume quotations |
| 🔄 **Follow Up** | Following up on previous correspondence |
| ⏰ **Reminder** | Reminding suppliers about pending deadlines |

### Step 2: Fill Recipient Details

| Field | Required | Description |
|-------|----------|-------------|
| **Supplier Name** | ✅ Yes | Company or contact name |
| **Email(s)** | Optional | Recipient email addresses (comma-separated) |
| **CC** | Optional | CC recipients (comma-separated) |

### Step 3: Fill Package Details

| Field | Required | Description |
|-------|----------|-------------|
| **Package Name** | ✅ Yes | Name of the package/project being quoted |
| **Reference Number** | Optional | Internal reference or project code |
| **Deadline** | Optional | Quote submission deadline |

### Step 4: Add Links

| Field | Description |
|-------|-------------|
| **Package Details Link** | Direct link to package specifications (SharePoint, Drive, etc.) |
| **Company Documents Link** | Link to your company's registration/certification documents |

> 💡 **Tip:** Click the 📁 folder icon next to link fields to access your saved links.

### Step 5: Add Notes (Optional)

Enter any additional requirements, specifications, or instructions for the supplier.

### Step 6: Review Preview

The right panel shows a **live preview** of your email as you type. Review:
- Subject line
- Email body formatting
- All details are correct

### Step 7: Send

Use the action buttons at the bottom to send or export your email.

---

## Email Templates

### 📄 Standard Template

The default professional RFQ format:

```
Subject: RFQ - [Package Name] - [Your Company]

Dear [Supplier Name],

We are writing to request a quotation for [Package Name].

[Package details and links]

Please submit your quotation by [Deadline].

[Signature]
```

### ⚡ Urgent Template

For time-sensitive requests with priority emphasis:

```
Subject: URGENT: RFQ - [Package Name] - [Your Company]

Dear [Supplier Name],

We urgently require a quotation for [Package Name].
This is a time-sensitive request.

⏰ DEADLINE: [Deadline]

[Rest of email...]
```

### 🏆 Competitive Template

For bidding processes:

```
Subject: Competitive Bid - [Package Name] - [Your Company]

Dear [Supplier Name],

You are invited to participate in our competitive bidding process for [Package Name].

[Bid details...]
```

### 📦 Bulk Order Template

For large-scale quotations:

```
Subject: Bulk Order RFQ - [Package Name] - [Your Company]

Dear [Supplier Name],

We are requesting a quotation for a large-scale order of [Package Name].

[Volume and specifications...]
```

### 🔄 Follow Up Template

For following up on previous emails:

```
Subject: RE: RFQ - [Package Name] - [Your Company]

Dear [Supplier Name],

Following up on our previous request for quotation regarding [Package Name].

[Follow-up details...]
```

### ⏰ Reminder Template

For deadline reminders:

```
Subject: REMINDER: RFQ Deadline - [Package Name] - [Your Company]

Dear [Supplier Name],

This is a friendly reminder that the deadline for [Package Name] is approaching.

⏰ Deadline: [Date/Time]

[Reminder details...]
```

---

## Sending Options

### 📧 Send Email

Opens your default email client (Outlook, Gmail, Apple Mail, etc.) with:
- Recipient pre-filled
- Subject line pre-filled
- Email body pre-filled

**Requirements:**
- A default email client must be configured
- Browser must allow `mailto:` links

**Limitations:**
- Very long emails may exceed `mailto:` URL limits (~2000 characters)
- A warning badge appears if the email is too long

### 📋 Copy to Clipboard

| Button | Action |
|--------|--------|
| **Copy Body** | Copies the complete email body text |
| **Copy Subject** | Copies just the subject line |

Use these when:
- The email is too long for `mailto:`
- You prefer to paste into your email client manually
- You need to share the text in another application

### 📥 Download

| Format | Description | Use Case |
|--------|-------------|----------|
| **.txt** | Plain text file | Simple archive or sharing |
| **.eml** | Email file format | Open directly in Outlook, Thunderbird, etc. |

The `.eml` format includes:
- Proper email headers
- Thread references (for follow-ups)
- Can be opened by most email clients

---

## Email History

The **History** tab shows all emails you've sent from this browser.

### Features

- **Search** — Filter emails by supplier name, package, or content
- **Sort** — Order by date, supplier, or package
- **View Details** — Click any email to see the full content
- **Follow Up** — Create a follow-up email linked to the original
- **Copy** — Copy the email body to clipboard
- **Delete** — Remove from history

### Email Thread View

When viewing an email that's part of a thread:
- Previous emails in the conversation are shown
- Thread ID is displayed
- "Follow Up" button creates a new email in the same thread

---

## Link Management

The **Links** tab stores frequently-used links for quick access.

### Saving Links

Links are automatically saved when you:
1. Send an email containing links
2. Manually add a link via the Links tab

### Using Saved Links

1. In the Compose tab, click the 📁 folder icon next to any link field
2. A popup shows your saved links
3. Click a link to insert it into the field

### Managing Links

| Action | How |
|--------|-----|
| **Search** | Type in the search box |
| **Delete** | Click the trash icon |
| **Copy** | Click the copy icon |

---

## Data Management

### Where is Data Stored?

All data is stored in your browser's **localStorage**:

| Data | Storage Key |
|------|-------------|
| Sent Emails | `automail_v2_emails` |
| Threads | `automail_v2_threads` |
| Saved Links | `automail_v2_links` |
| History Log | `automail_v2_history` |
| Current Draft | `automail_v2_draft` |

### Exporting Data

Click the **Export** button (top-right) to download a JSON backup containing:
- All sent emails
- All threads
- All saved links
- Export timestamp

### Resetting Data

- **Reset Form** — Clears the current form only
- **Clear All Data** — Removes all stored data (in browser DevTools)

To clear all data:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete keys starting with `automail_v2_`

---

## Tips & Best Practices

### ✅ Do

- **Use templates appropriately** — Match the template to the situation
- **Fill in deadlines** — Helps suppliers prioritize
- **Provide complete links** — Direct URLs to specification documents
- **Use the History tab** — Track what you've sent and when
- **Export backups** — Download JSON backups periodically

### ❌ Don't

- **Don't store passwords** — localStorage is not encrypted
- **Don't rely solely on `mailto:`** — Use copy/download for long emails
- **Don't ignore the preview** — Always review before sending
- **Don't forget to customize** — Update `company-details.ts` with your info

---

## Troubleshooting

### "Send Email" doesn't open my email client

1. Check if a default email client is configured in your OS
2. Try using "Copy Body" instead and paste into your email client
3. Download as `.eml` and open with your email client

### Email is too long for "Send Email"

The `mailto:` protocol has a ~2000 character limit. Solutions:
1. Use **Copy Body** and paste into your email client
2. Download as **.eml** file and open in Outlook
3. Shorten your notes section

### Data disappeared

Data is stored in localStorage, which can be cleared by:
- Clearing browser data
- Using "Clear Storage" in DevTools
- Browser privacy settings

**Solution:** Export backups regularly using the Export button.

### Preview not updating

Try:
1. Refreshing the page
2. Clearing the form and re-entering data
3. Checking browser console for errors

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save draft (auto-saved anyway) |
| `Tab` | Move to next field |
| `Enter` | In text fields: insert line break |

---

## Need Help?

- 📖 Check other documentation in the `docs/` folder
- 🐛 Report issues on GitHub Issues
- 💬 Ask questions in GitHub Discussions
