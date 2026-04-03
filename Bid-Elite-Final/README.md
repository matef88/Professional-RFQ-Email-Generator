<div align="center">
  <h1>🚀 Bid Elite</h1>
  <p><strong>Professional AI-Powered RFQ & Bidding Platform</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
</div>

<br />

## 📖 Overview

**Bid Elite** is a modern, full-stack platform designed to streamline the Request for Quotation (RFQ) and bidding process. It leverages seamless AI integration to automate the generation of professional emails, dynamic RFQ documents, and provide intelligent insights—all operating within a robust, beautifully crafted dashboard.

## ✨ Features

- 🤖 **AI-Powered Automation**: Leverage Google Generative AI for precision drafting of RFQs, emails, and data analysis.
- 🛡️ **Secure Authentication**: Encrypted, role-based access control via NextAuth.js.
- 📊 **Dynamic Analytics**: Visualize your performance metrics with built-in interactive dashboards (Powered by Recharts).
- 📄 **Extensive Document Processing**: Generate pixel-perfect PDFs, Excel spreadsheets, or reliably parse incoming documents.
- ☁️ **Cloud Native**: Engineered for zero-downtime deployment natively on Vercel coupled with Vercel Postgres and Blob.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: Vercel Postgres paired with [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Engine**: [Google Generative AI](https://ai.google.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Local or Cloud Postgres Database (Vercel Postgres config preferred)
- Essential Environment Variables (Gemini AI Keys, Auth Secrets, DB URIs)

### Local Development Lifecycle

1. **Clone the repository:**

```bash
git clone https://github.com/matef88/bid-elite.git
cd bid-elite
```

2. **Install dependencies:**

```bash
npm install
# or yarn / pnpm / bun
```

3. **Configure the Environment:**

Copy the example environment pattern:
```bash
cp .env.local.example .env.local
```
Edit `.env.local` to incorporate your specific configuration strings.

4. **Initialize the Database Schema:**

Push your Drizzle schema and deploy initial seed data:
```bash
npm run db:push
npm run db:seed
```

5. **Launch the platform:**

```bash
npm run dev
```

The application will be hot-reloading at [http://localhost:3000](http://localhost:3000).

## 🚢 Deployment

The repository is pre-configured and optimized to be deployed to the [Vercel Platform](https://vercel.com/new). 

1. Link the repository directly to your Vercel account.
2. Ensure you provision and link Vercel Postgres and Vercel Blob integrations in the project settings.
3. Validate that all production environment variables match your `.env.local`.

To verify your production bundle locally before releasing:
```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the issues page.

## 📄 License & Contact

This project is maintained by [matef88](https://github.com/matef88).
