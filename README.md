# AppraiseTrack

> **Order Management System for Appraisal Companies**

A modern, full-featured order management system built with Next.js 15, Supabase, and AI-powered appraiser assignment.

![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

## ✨ Features

- 📊 **Dashboard** - Real-time stats and metrics
- 📋 **Order Management** - Comprehensive order tracking with filtering, sorting, and search
- 🧙‍♂️ **AI-Powered Assignment** - Intelligent appraiser suggestion using OpenAI/Anthropic
- 👥 **Client Management** - Track clients and their orders
- 🔐 **Authentication** - Secure auth with Supabase Auth
- 🎨 **Modern UI** - Beautiful, responsive interface with shadcn/ui
- 🔄 **Real-time Updates** - Live data synchronization with Supabase
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## 🏗️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** Vercel AI SDK with OpenAI/Anthropic
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** TanStack React Query
- **Form Handling:** React Hook Form + Zod
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- An OpenAI or Anthropic API key (for AI features)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Salesmod
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project's SQL Editor
3. Run the migration script from `supabase-migration.sql`
4. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (choose one or both)
OPENAI_API_KEY=your_openai_api_key
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

### 5. Create Your First User

1. Navigate to the login page
2. Click "Sign Up"
3. Enter your details
4. Check your email for verification (Supabase will send it)
5. Sign in and start using the app!

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (app)/               # Protected app routes
│   │   ├── dashboard/       # Dashboard page
│   │   ├── orders/          # Order management
│   │   └── clients/         # Client management
│   ├── api/                 # API routes
│   │   └── suggest-appraiser/  # AI suggestion endpoint
│   ├── login/               # Auth page
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── auth/               # Auth components
│   ├── clients/            # Client components
│   ├── layout/             # Layout components
│   ├── orders/             # Order components
│   └── ui/                 # shadcn/ui components
├── hooks/                   # Custom React hooks
│   ├── use-orders.ts       # Order data hooks
│   ├── use-clients.ts      # Client data hooks
│   └── use-appraisers.ts   # Appraiser data hooks
├── lib/                     # Utilities and helpers
│   ├── supabase/           # Supabase client configs
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
└── contexts/                # React contexts
```

## 🗄️ Database Schema

The application uses the following main tables:

- **profiles** - User profiles (extends Supabase auth.users)
- **clients** - Client companies and contacts
- **orders** - Appraisal orders with full details
- **order_history** - Audit trail of order changes
- **order_documents** - File attachments
- **order_notes** - Notes and communications

See `supabase-migration.sql` for the complete schema with Row Level Security policies.

## 🔐 Authentication

The app uses Supabase Auth with:
- Email/password authentication
- Automatic profile creation on signup
- Protected routes with middleware
- Row Level Security on all tables

## 🤖 AI Features

The AI appraiser suggestion feature considers:
- Geographic coverage (matches property location)
- Current workload (selects least busy)
- Appraiser rating (prioritizes higher rated)
- Order priority (assigns experienced appraisers to rush orders)

To use a different AI provider, update the model in `/api/suggest-appraiser/route.ts`.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
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
1. Check the [Supabase docs](https://supabase.com/docs)
2. Review the [Next.js docs](https://nextjs.org/docs)
3. Open an issue on GitHub

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and auth by [Supabase](https://supabase.com/)
- AI powered by [Vercel AI SDK](https://sdk.vercel.ai/)

---

**Made with ❤️ for the appraisal industry**
