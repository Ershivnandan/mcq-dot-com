# 🧠 MCQ Quiz Manager — Enterprise Full-Stack Rebuild

A modern, production-ready, full-stack quiz and spaced-repetition platform built with **Next.js 15 (App Router)**, **React 19**, **Native MongoDB Driver (`mongodb`)**, **MongoDB Atlas**, **Tailwind CSS v4**, and **BYOK AI** (Google Gemini, OpenAI, Anthropic).

---

## 🌟 Key Features

- 🔒 **Native MongoDB Atlas Driver**: 100% pure Node.js MongoDB driver connection pooling (`MongoClient`). Zero heavy binary engine dependencies, zero migration bottlenecks. Collections and indexes are created automatically on write.
- 🤖 **Bring-Your-Own-Key (BYOK) AI**: Connect Google Gemini, OpenAI, or Anthropic. All API keys are encrypted at rest with **AES-256-GCM** and never sent to the client browser.
- 🛡️ **AI Draft Approval Workflow**: AI-generated questions are saved with `DRAFT` status and reviewed by you before being added to your permanent question bank.
- 📈 **Spaced Repetition (SuperMemo SM-2)**: Algorithmically schedules daily reviews based on recall accuracy and response time, preventing the forgetting curve.
- 🎯 **Dual Quiz Modes**:
  - **Practice Mode**: Instant answer feedback, full explanations, related questions, and bookmarking.
  - **Exam Mode**: Timed examination, question palette (answered/unanswered/flagged), option randomization, and comprehensive result reports.
- 📊 **Interactive Analytics**: Visual KPI cards, streak tracking, accuracy by topic and difficulty, and 30-day performance trends built with Recharts.
- ⚡ **Productivity & Design**:
  - Global Command Palette (`Ctrl+K` or `Cmd+K`)
  - Full keyboard shortcuts (`1-4` for options, `N`/`P` for navigation, `Enter` to submit)
  - 5 Theme Modes: **Dark**, **Light**, **OLED Black**, **Sepia**, and **System**
  - Offline-ready PWA Web App Manifest
- 📦 **Legacy Data Migration**: Intelligent importer for `mcq_backup_new.json` that extracts hidden date headers (e.g., `📋 1 May 2026 📋`) into true `questionDate` timestamps while deduplicating starred questions.
- 📱 **Mobile Ready**: RESTful `/api/*` endpoints designed to power a future React Native / Expo mobile application.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Components & Server Actions) |
| **UI Library** | React 19, Lucide React, Framer Motion |
| **Styling** | Tailwind CSS v4, Radix UI Primitives, Custom Themes |
| **Database** | MongoDB Atlas via Official Native `mongodb` Driver (v7) |
| **Encryption** | AES-256-GCM (Cipher/Decipher with Auth Tag verification) |
| **AI Providers** | Google Gemini (`@google/genai`), OpenAI API, Anthropic Claude |
| **Testing** | Vitest with fast TypeScript runner |
| **Data Visualization** | Recharts Responsive Visualizations |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.17+ (v20+ recommended)
- **pnpm**: v9+ (or `npm` / `yarn`)
- **MongoDB Atlas**: A free cluster at [cloud.mongodb.com](https://www.mongodb.com/cloud/atlas)

### 2. Environment Setup

Create or check the `.env` file in the root directory:

```bash
# MongoDB Atlas connection string
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/mcq_quiz_manager?retryWrites=true&w=majority"

# 32-byte secret for session cookies (generate with `openssl rand -base64 32`)
AUTH_SECRET="e9a2f7c4b1d8e3a5f6c7b8d9e0a1f2c3b4d5e6a7f8b9c0d1e2f3a4b5c6d7e8f9"

# 32-byte hex key (64 hex characters) for AES-256-GCM encryption of user AI keys
ENCRYPTION_KEY="7d4e1a8b9c2f3e5a6b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Important**: In your MongoDB Atlas dashboard under **Network Access**, ensure your IP address (or `0.0.0.0/0` for universal development access) is added to the IP Access List so Atlas allows connections.

### 3. Running the Application

Because we use the native MongoDB driver, **no schema pushes or database migrations are required**! MongoDB automatically initializes collections and indexes on demand.

```bash
# Start local development server
pnpm dev

# Open http://localhost:3000 in your browser
```

---

## 📥 Importing Legacy Backup Data

### Method 1: Using the Web UI
1. Start the app and log in or sign up at `http://localhost:3000/signup`.
2. Navigate to **Settings** (`/settings`) → **Backup & Restore**.
3. Drag & drop `mcq_backup_new.json` into the upload zone and click **Start Import**.
4. The system will process all folders, extract date headers, map topics, and skip duplicates in real time.

### Method 2: Command-Line Migration Script
You can also run the CLI migration script directly:

```bash
pnpm run db:import
```

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite covering AES-256-GCM encryption, date header parsing, Zod validation schemas, and SM-2 spaced repetition scoring:

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm run test:watch
```

To verify production build compilation and type safety:

```bash
pnpm build
```

---

## 🤖 Configuring BYOK AI

1. Go to **Settings** → **AI Provider** (`/settings/ai`).
2. Select your preferred provider (**Google Gemini**, **OpenAI**, or **Anthropic**).
3. Paste your API key.
4. Click **Test Connection** to verify your key works directly against the provider.
5. Click **Save Configuration**. Your key is immediately encrypted using AES-256-GCM before database insertion.

### Generating Questions:
- Go to the **AI Generator** tab (`/ai`).
- Enter a topic, difficulty, number of questions, or paste reference study text.
- Click **Generate Questions**.
- Generated questions appear in your **AI Review Queue**. You can edit questions, explanations, or options, then click **Approve** to transfer them to your question bank or **Reject** to discard them.

---

## 📂 Project Structure

```
├── scripts/
│   └── import-backup.ts       # CLI migration script for mcq_backup_new.json
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Signup, Forgot Password
│   │   ├── (dashboard)/       # Dashboard, Questions, Quizzes, AI, Analytics, Collections, Settings
│   │   ├── api/               # Secure RESTful API endpoints
│   │   ├── layout.tsx         # Root layout with theme provider
│   │   └── manifest.ts        # PWA Web App Manifest
│   ├── components/
│   │   ├── ai/                # AI Generator & Draft Approval cards
│   │   ├── analytics/         # Recharts KPI dashboards
│   │   ├── layout/            # Header, Sidebar, MobileNav, CommandPalette
│   │   ├── questions/         # QuestionCard, Table, Filters, Editor
│   │   ├── quiz/              # QuizCreator, QuizRunner, QuizResults
│   │   └── ui/                # Accessible Radix + Tailwind UI components
│   ├── lib/
│   │   ├── validation/        # Zod validation schemas
│   │   └── utils.ts           # Styling and date/time helpers
│   ├── middleware.ts          # Edge authentication guard
│   ├── server/
│   │   ├── auth/              # Bcrypt hashing, session cookies, auth guards
│   │   ├── db.ts              # Native MongoClient connection pool & collection helpers
│   │   ├── encryption/        # AES-256-GCM crypto service
│   │   ├── providers/         # Gemini, OpenAI, and Anthropic API clients
│   │   └── services/          # Core domain business logic
│   └── types/
│       └── database.ts        # Pure TypeScript interfaces for all collections
└── tests/
    └── unit/                  # Vitest unit test suites
```

---

## 📄 License
MIT
