<div align="center">

# 📧 Professional RFQ Email Generator

### Streamline Your Procurement Workflow

**A browser-based tool for creating standardized Request for Quotation emails.**  
No backend required — runs entirely in your browser.

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CodeSandbox](https://img.shields.io/badge/CodeSandbox-Ready-151515?logo=codesandbox&logoColor=white)](https://codesandbox.io)

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🎨 Customization](#-customization) • [💡 Why This Tool](#-why-this-tool)

</div>

---

## 🎯 Why This Tool?

### The Problem

In procurement teams, multiple team members send RFQ requests to suppliers daily. Without a standardized system:
- ❌ **Inconsistent naming** — Each person uses different package names
- ❌ **Hard to trace** — Difficult to track who requested what
- ❌ **Lost information** — No central record of sent requests
- ❌ **Time wasted** — Manually composing similar emails repeatedly

### The Solution

This tool enforces **standardized package naming** following your **Master BOQ (Bill of Quantities) format**:

- ✅ **Consistent naming** — All team members use the same package naming convention
- ✅ **Easy tracing** — Anyone can find and reference any package request
- ✅ **Complete history** — Every email is logged and searchable
- ✅ **Faster workflow** — Templates and saved links speed up email creation
- ✅ **Team collaboration** — Standardized format means anyone can pick up any thread

> **When your entire procurement team uses the same naming methodology, everyone can access, understand, and follow up on each other's requests.**

---

## 🚀 Quick Start

### Option 1: CodeSandbox (No Installation Required)

The fastest way to get started:

1. Go to [codesandbox.io](https://codesandbox.io)
2. Click **"Create Sandbox"** → **"Import Project"** → **"Import from GitHub"**
3. Paste the repository URL:
   ```
   https://github.com/matef88/Professional-RFQ-Email-Generator
   ```
4. Done! CodeSandbox installs dependencies automatically

👉 **[Detailed CodeSandbox Setup Guide](docs/CODESANDBOX.md)**

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/matef88/Professional-RFQ-Email-Generator.git
cd Professional-RFQ-Email-Generator

# Install dependencies
npm install

# Start development server
npm start
```

The app opens at `http://localhost:3000`

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[User Guide](docs/USER_GUIDE.md)** | How to use the application |
| **[CodeSandbox Setup](docs/CODESANDBOX.md)** | Step-by-step CodeSandbox deployment |
| **[Project Structure](docs/STRUCTURE.md)** | File organization explained |
| **[Customization Guide](docs/CUSTOMIZATION.md)** | Change company details & settings |
| **[Theming Guide](docs/THEME.md)** | Modify colors, fonts, and layout |

---

## 🎨 Customization

### Change Company Details (1-Minute Setup)

Edit **[`src/company-details.ts`](src/company-details.ts)** — this is the ONLY file you need to modify:

```typescript
export const COMPANY_NAME = "Your Company Name";
export const COMPANY_SHORT_NAME = "YC";
export const COMPANY_TAGLINE = "Your Tagline Here";
export const COMPANY_EMAIL = "procurement@yourcompany.com";
export const COMPANY_WEBSITE = "https://yourcompany.com";
export const COMPANY_PHONE = "+1 555 123 4567";
export const COMPANY_CITY = "Your City";
export const COMPANY_COUNTRY = "Your Country";
export const COMPANY_DOCS_LINK = "https://yourcompany.sharepoint.com/docs";
```

Save the file and the app reloads instantly with your branding.

👉 **[Full Customization Guide](docs/CUSTOMIZATION.md)**

---

## 💡 Features

### 📝 Email Templates

| Template | Icon | Use Case |
|----------|------|----------|
| **Standard** | 📄 | Default professional RFQ |
| **Urgent** | ⚡ | Time-sensitive requests |
| **Competitive** | 🏆 | Bidding processes |
| **Bulk Order** | 📦 | Large-scale quotations |
| **Follow Up** | 🔄 | Follow-up on previous emails |
| **Reminder** | ⏰ | Deadline reminders |

### 🔗 Email Threading

Follow-up emails automatically include `In-Reply-To` and `References` headers, so they appear in the **same Outlook/Gmail conversation thread** as the original email.

### 💾 Data Persistence

All data stored locally in your browser:

| Data | Storage Key | Purpose |
|------|-------------|---------|
| Sent Emails | `automail_v2_emails` | Complete email history |
| Threads | `automail_v2_threads` | Email conversation groupings |
| Saved Links | `automail_v2_links` | Reusable SharePoint links |
| Drafts | `automail_v2_draft` | Auto-saved form state |

### 📤 Export Options

- **Send** — Opens default email client (Outlook, Gmail, etc.)
- **Copy** — Copy subject or body to clipboard
- **.txt** — Download as plain text file
- **.eml** — Download as Outlook-compatible email file
- **JSON** — Export all data for backup

---

## 🗂️ Project Structure

```
Professional-RFQ-Email-Generator/
├── 📁 public/
│   └── index.html              # HTML entry point
├── 📁 src/
│   ├── company-details.ts      # ⭐ YOUR COMPANY INFO (edit this!)
│   ├── config.ts               # App configuration (don't edit)
│   ├── types.ts                # TypeScript definitions
│   ├── utils.ts                # Email generation logic
│   ├── storage.ts              # localStorage service
│   ├── App.tsx                 # Main React component
│   ├── styles.css              # All styling
│   └── index.tsx               # React entry point
├── 📁 docs/                    # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

👉 **[Detailed Structure Guide](docs/STRUCTURE.md)**

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **localStorage** | Data Persistence |
| **CSS3** | Styling with CSS Variables |

**No external dependencies** — no UI libraries, no backend, no API keys.

---

## ❓ FAQ

<details>
<summary><strong>Does this work with Outlook / Gmail?</strong></summary>

Yes! The "Send Email" button uses the `mailto:` protocol, which opens your default email client with the email pre-filled. You can also copy the body and paste it into any email client manually.
</details>

<details>
<summary><strong>Will I lose my data if I refresh?</strong></summary>

No. All data is automatically saved to localStorage. It persists across page refreshes and browser restarts. Data is only lost if you clear browser data or manually reset the app.
</details>

<details>
<summary><strong>Can multiple people share the same instance?</strong></summary>

Each browser has its own localStorage, so data isn't shared. For team use, each person should have their own CodeSandbox sandbox or local installation. However, since everyone uses the same standardized format, collaboration is seamless.
</details>

<details>
<summary><strong>Is my data secure?</strong></summary>

Data stays in your browser — nothing is transmitted to any server. However, localStorage is not encrypted, so avoid storing sensitive credentials in email fields.
</details>

<details>
<summary><strong>The "Send Email" button shows a length warning?</strong></summary>

The `mailto:` protocol has a URL length limit (~2000 characters). If your email is too long, use "Copy Body" or download as `.eml` file instead.
</details>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**[@matef88](https://github.com/matef88)**

---

<div align="center">

**Made with ❤️ for procurement teams everywhere**

*Standardized workflows = Efficient teams = Better results*

[⬆ Back to Top](#-professional-rfq-email-generator)

</div>
