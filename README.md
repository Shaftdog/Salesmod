# Salesmod

> **Appraisal Workflow Management System**

A modern, full-featured appraisal management system with AI agents, CRM, case management, and automated workflows. Built with Next.js 15, Supabase, and AI integration.

![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

## ✨ Key Features

- 🤖 **AI Agent System** - Automated workflow orchestration with intelligent agents
- 💬 **Chat Interface** - Conversational UI with RAG (Retrieval Augmented Generation)
- 📋 **Order Management** - Complete order tracking with kanban boards
- 🏢 **Case Management** - Structured case workflow management
- 👥 **CRM** - Client relationship management with contacts and activities
- 🏠 **Property Management** - Property and unit tracking
- 📊 **Admin Panel** - Administrative controls and monitoring
- 🎯 **Goals System** - Goal tracking and progress monitoring
- 📧 **Email Integration** - Automated email workflows
- 🔐 **Authentication** - Secure auth with Supabase and RBAC

## 🏗️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript (Strict Mode)
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth with RBAC
- **AI:** Vercel AI SDK with OpenAI/Anthropic
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** TanStack React Query
- **Form Handling:** React Hook Form + Zod
- **Testing:** Playwright for E2E, Vitest for unit tests
- **Deployment:** Vercel

## 📚 Documentation

**Full documentation is organized in the [`docs/`](docs/index.md) directory:**

- **[Documentation Index](docs/index.md)** - Complete documentation navigation
- **[Getting Started](docs/getting-started/SETUP-STEPS.md)** - Setup and installation guide
- **[Architecture](docs/architecture/)** - System design and data model
- **[Features](docs/features/)** - Feature documentation by category
  - [Agents](docs/features/agents/) - AI agent system
  - [Chat](docs/features/chat/) - Chat interface with RAG
  - [Properties](docs/features/properties/) - Property management
  - [Case Management](docs/features/case-management/) - Case workflows
  - [And more...](docs/features/)
- **[Operations](docs/operations/)** - Database, imports, and deployment
- **[Testing](docs/testing/TESTING-GUIDE.md)** - Testing guides and results
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- An OpenAI or Anthropic API key (for AI features)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Salesmod

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and AI API keys

# Run database migrations
# See docs/operations/database-migrations/ for details

# Start development server
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

**For detailed setup instructions, see [docs/getting-started/SETUP-STEPS.md](docs/getting-started/SETUP-STEPS.md)**

## 📁 Project Structure

```
Salesmod/
├── docs/                     # 📚 Complete documentation
│   ├── features/            # Feature-specific docs
│   ├── operations/          # Ops, deployment, migrations
│   ├── testing/             # Test guides and results
│   └── troubleshooting/     # Common issues and fixes
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (app)/          # Protected app routes
│   │   ├── api/            # API routes
│   │   └── login/          # Auth pages
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   └── contexts/           # React contexts
├── e2e/                     # Playwright E2E tests
├── tests/                   # Unit and integration tests
└── supabase/               # Supabase migrations
```

## 🗄️ Database Schema

The application uses Supabase (PostgreSQL) with comprehensive Row Level Security:

**Core Tables:**
- `profiles` - User accounts and settings
- `clients` - Client companies
- `contacts` - Client contacts with party roles
- `properties` - Properties and units
- `orders` - Appraisal orders
- `cases` - Case management workflows
- `agent_cards` - AI agent task cards

**See [docs/architecture/](docs/architecture/) for complete schema documentation.**

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

**For production deployment checklist, see [docs/operations/production-deployment/](docs/operations/production-deployment/)**

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
npm run test         # Run unit tests
npm run test:e2e     # Run Playwright E2E tests
```

## 🎨 Design System

The app follows a professional design language:
- **Primary Color:** Dark slate blue (#3771C8)
- **Accent Color:** Deep purple (#5E3391)
- **Typography:** Inter font family
- **Components:** shadcn/ui with Radix UI primitives

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the [docs/troubleshooting/](docs/troubleshooting/) directory
2. Review the [Supabase docs](https://supabase.com/docs)
3. Review the [Next.js docs](https://nextjs.org/docs)
4. Open an issue on GitHub

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and auth by [Supabase](https://supabase.com/)
- AI powered by [Vercel AI SDK](https://sdk.vercel.ai/)

---

**Made with ❤️ for the appraisal industry**

For more information, see [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) or browse the [complete documentation](docs/index.md).
