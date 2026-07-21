<div align="center">
  <h1>PromptMinder</h1>
  <p>
    <a href="README.md">中文</a> | 
    <a href="README_EN.md">English</a>
  </p>
</div>

# PromptMinder

A professional prompt management platform that makes AI prompt management simpler and more efficient

![Main Page](/public/main-page.png)

## 🌟 Features

### Core Functions

- ✅ **Prompt Version Management** - Support for version history and rollback
- ✅ **Version Diff Comparison** - Git-like side-by-side diff view to quickly identify prompt changes
- ✅ **Version Approval Workflow** - Team workspaces support configurable approval flow (submit/approve/reject/withdraw)
- ✅ **Review Thread with @Mentions** - Change-request-level comments with `@team member` mentions
- ✅ **Change Subscription & Notification Center** - Subscribe to prompt changes and receive in-app notifications
- ✅ **Tag Management** - Custom tags for quick categorization and retrieval
- ✅ **Public/Private Mode** - Support for private prompts and public sharing
- ✅ **AI Smart Generation** - Integrated AI models for generating quality prompts
- ✅ **Team Collaboration** - Team creation, member management, and role-based permissions
- ✅ **Prompt Contributions** - Community contribution features with review and publishing process
- ✅ **Agent Skills Catalog** - Browse synced public skills, install them, or add them to your workspace

### User Experience

- 📱 **Mobile Responsive** - Responsive design, perfect support for mobile devices
- 🌍 **Internationalization** - Support for Chinese and English
- 🎨 **Modern Interface** - Beautiful design based on Shadcn UI
- 🔍 **Smart Search** - Quick search and filtering functionality
- 📋 **One-Click Copy** - Convenient copy and share functions

### Technical Features

- ⚡ **High Performance** - Next.js 16 + React 19, lightning-fast loading
- 🔐 **Secure Authentication** - Enterprise-grade user authentication with Clerk
- 💾 **Reliable Storage** - Neon PostgreSQL + Drizzle ORM
- 🚀 **Easy Deployment** - Support for one-click deployment with Vercel and Zeabur

## 🚀 Quick Start

### Requirements

- Node.js 20.0 or higher
- pnpm 10.x (recommended; project scripts are documented with `pnpm`)
- Git

### Local Development

1. **Clone the project**

```bash
git clone https://github.com/your-username/promptMinder.git
cd promptMinder
```

2. **Install dependencies**

```bash
# recommend using pnpm
pnpm install
```

3. **Configure environment variables**
   Create a `.env.local` file and configure the following variables:

```env
# Database configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Supabase configuration (file storage only)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk authentication configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# NextAuth configuration
AUTH_SECRET=your_auth_secret

# AI API configuration
ZHIPU_API_KEY=your_zhipu_api_key

# GitHub OAuth (optional)
GITHUB_ID=your_github_app_id
GITHUB_SECRET=your_github_app_secret

# Post-login redirects (optional)
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/prompts
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/prompts

# Admin / agent integration (optional)
ADMIN_EMAIL=admin@example.com
LANGGRAPH_TOKEN=your_langgraph_token
PROMPTMINDER_TOKEN=pm_xxx

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Run database migrations**

   After pulling the latest code, run migrations before starting the app (required for workflow tables/columns):

```bash
pnpm db:migrate
```

Sync the first batch of official Skills (requires a skills.sh Vercel OIDC token):

```bash
pnpm skills:sync
```

By default this syncs the first 50 curated skills. Full content is stored only for sources with a clear redistributable license and acceptable security status; other sources keep index metadata and attribution. Use `--limit=0` to sync all curated items, or add `--all` for the full catalog.

5. **Start the development server**

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## CLI Quick Start

Regular users do not need any admin script to get started. Create a token in the web app:

```text
https://www.prompt-minder.com/settings/cli-tokens
```

Then install and use the CLI:

```bash
npm i -g @aircrushin/promptminder-cli
promptminder auth login --token pm_xxx
promptminder team list
```

### CLI Agent Skill

If you want AI agents like Cursor, Claude Code, or Codex CLI to properly use PromptMinder CLI, install the standalone skill repository first:

```bash
npx skills add aircrushin/promptminder-cli-skill
```

Repository: `https://github.com/aircrushin/promptminder-cli-skill`

The CLI still retains `promptminder skills install` as a deprecated compatibility entry for legacy installations. Future updates will focus on the standalone skill repository.

### Common Development Commands

```bash
pnpm lint              # Run ESLint
pnpm test              # Run Jest tests
pnpm test:coverage     # Generate a coverage report
pnpm analyze           # Analyze build output size
pnpm cli:agent -- prompt.list
```

## 📦 Deployment Guide

### Vercel Deployment

1. **Preparation**

   - Fork this project to your GitHub account
   - Register and log in to [Vercel](https://vercel.com)
2. **Deployment Steps**

   - Click `New Project` in Vercel
   - Select `Import Git Repository`
   - Choose your forked project
   - Configure environment variables (see environment variables description above)
   - Click `Deploy`
3. **Automatic Deployment**

   - After deployment, each push to the main branch will automatically redeploy

### Zeabur Deployment

1. Visit [Zeabur](https://zeabur.com) and log in
2. Create a new project and connect your GitHub repository
3. Configure environment variables
4. Deploy and get the access address

   [![Deployed on Zeabur](https://zeabur.com/deployed-on-zeabur-dark.svg)](https://zeabur.com/referral?referralCode=aircrushin&utm_source=aircrushin&utm_campaign=oss)

## 🗃 Database Configuration

### Neon PostgreSQL + Drizzle ORM

This project uses [Neon](https://neon.tech) Serverless PostgreSQL as the database and [Drizzle ORM](https://orm.drizzle.team) for database queries and schema management.

1. **Create a Neon database**

   - Register for a [Neon](https://neon.tech) account
   - Create a new project and get the `DATABASE_URL` connection string
   - Add the connection string to `DATABASE_URL` in `.env.local`

2. **Initialize database schema**

```bash
# Push Drizzle schema to the database (first time or development)
pnpm db:push
```

3. **Database commands**

```bash
pnpm db:push       # Push schema to database (recommended for development)
pnpm db:generate   # Generate SQL migration files
pnpm db:migrate    # Run migration files (recommended for production)
pnpm db:studio     # Open Drizzle Studio for visual database management
```

4. **Schema and migration files**

   The project currently uses `drizzle.config.mjs` and the `drizzle/` directory for migration execution, while keeping initialization and supplemental SQL scripts in `sql/`:
   - `drizzle/migrate.js` — migration entry script
   - `drizzle/` — Drizzle migration-related files
   - `sql/teams.sql` — team and membership tables
   - `sql/prompts.sql` — core prompt and version data
   - `sql/tags.sql` — tag-related tables
   - `sql/projects.sql` — project organization tables
   - `sql/contributions.sql` — community contribution and review flow

## 🔄 Team Workflow Notes

- Team managers can enable/disable the version approval workflow in Team Management.
- Existing teams are default `OFF`; newly created teams are default `ON`.
- When enabled, new prompts and edits are submitted as change requests instead of being published directly.
- Approval permissions: `owner/admin`; review threads support `@mentions`.
- Prompt-level subscriptions and the Notification Center are available for in-app updates.

## 🧩 Agent Skills Catalog

PromptMinder includes a Skills catalog at `/skills` for discovering, reviewing, and reusing public Agent Skills.

### What it supports

- **Browse**: Paginated catalog with search by name, description, or source
- **Sort**: By install count (most popular) or recently synced
- **Detail pages**: Source, license, install count, Markdown body, and supporting files
- **Install methods**: Command / Prompt snippets aligned with [skills.sh](https://skills.sh), with one-click copy
- **Add to workspace**: Signed-in users can add available content as a prompt and continue editing in the library
- **Content policy**: Full content is hosted only for clearly redistributable, acceptable sources; other entries keep index metadata and link back to the original repository

### Syncing data

Sync the catalog from public sources with:

```bash
pnpm skills:sync
```

Defaults to the first 50 curated skills. Use `--limit=0` for all curated items, or `--all` for the full catalog. A skills.sh Vercel OIDC token is required.

### Relationship to the CLI Skill

- **Site Skills catalog**: Browse public/community skills and optionally add them to a PromptMinder workspace
- **PromptMinder CLI Skill**: Teaches AI agents how to use the PromptMinder CLI (see “CLI Agent Skill” above)

They complement each other and are not substitutes.

## 🔐 Authentication Configuration

### Clerk Setup

1. **Create a Clerk application**

   - Visit [Clerk](https://clerk.com)
   - Create a new application
   - Select authentication methods (email, social login, etc.)
2. **Configure OAuth providers**

   - Enable GitHub, Google, and other login methods in the Clerk console
   - Configure callback URLs
3. **Get keys**

   - Copy the Publishable Key and Secret Key
   - Add them to your environment variables

For detailed configuration, refer to the [Clerk official documentation](https://clerk.com/docs)

## 🌍 Internationalization

The project supports multiple languages, currently:

- 🇨🇳 Simplified Chinese
- 🇺🇸 English

Language files are located in the `/messages` directory:

- `zh.json` - Chinese translations
- `en.json` - English translations

### Adding a new language

1. Create a new language file in the `/messages` directory
2. Copy the structure of an existing translation file
3. Add support for the new language in `LanguageContext`

## 🛠 Development Guide

### Project Structure

```text
promptMinder/
├── app/                    # Next.js App Router pages and APIs
├── components/             # React components (including ui/prompt/team, etc.)
├── contexts/               # React Context
├── hooks/                  # Custom Hooks
├── lib/                    # Utilities, auth, team context, and business logic
├── messages/               # Localization messages
├── drizzle/                # Drizzle migration scripts
├── sql/                    # Initialization / supplemental SQL scripts
├── packages/               # Subpackages such as the CLI
├── docs/                   # Project documentation
└── public/                 # Static assets
```

### Code Standards

- Use ESLint for code checking
- Follow React Hooks best practices
- The project is JavaScript-first and uses `jsconfig.json` for the `@/` path alias
- CSS uses Tailwind CSS

### Contribution Guidelines

1. Fork this project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 🤝 Community

### User Feedback

Use [Canny](https://canny.io) to collect user feedback and feature requests.

1. Register for a Canny account and create a project
2. Get the Canny URL
3. Configure the link in the application's Footer component

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 💖 Support the Project

If this project has been helpful to you, welcome to:

- ⭐ Star the project
- 🍴 Fork and improve
- 🐛 Submit bug reports
- 💡 Suggest new features

<a href="https://www.buymeacoffee.com/aircrushin" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>

---

**PromptMinder** - Making AI prompt management simpler ✨
