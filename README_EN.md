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
- ✅ **Tag Management** - Custom tags for quick categorization and retrieval
- ✅ **Public/Private Mode** - Support for private prompts and public sharing
- ✅ **AI Smart Generation** - Integrated AI models for generating quality prompts
- ✅ **Team Collaboration** - Support for team creation and member management (in development)
- ✅ **Prompt Contributions** - Community contribution features with review and publishing process

### User Experience

- 📱 **Mobile Responsive** - Responsive design, perfect support for mobile devices
- 🌍 **Internationalization** - Support for Chinese and English
- 🎨 **Modern Interface** - Beautiful design based on Shadcn UI
- 🔍 **Smart Search** - Quick search and filtering functionality
- 📋 **One-Click Copy** - Convenient copy and share functions

### Technical Features

- ⚡ **High Performance** - Next.js 16 + React 19, lightning-fast loading
- 🔐 **Secure Authentication** - Enterprise-grade user authentication with Clerk
- 💾 **Reliable Storage** - Supabase + PostgreSQL database
- 🚀 **Easy Deployment** - Support for one-click deployment with Vercel and Zeabur

## 🚀 Quick Start

### Requirements

- Node.js 20.0 or higher
- npm or pnpm package manager
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
# Supabase configuration
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

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Start the development server**

```bash
npm run dev
# or use pnpm
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

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

### Supabase Setup

1. **Create a project**

   - Register for a [Supabase](https://supabase.com) account
   - Create a new project
   - Get the project URL and anonymous key
2. **Create data tables**
   Execute the following SQL statements to create the required data tables:

```sql
-- Create prompts table
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    user_id TEXT,
    version TEXT,
    tags TEXT,
    cover_img TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE
);

-- Create tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(name, user_id)
);

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    avatar_url TEXT,
    is_personal BOOLEAN DEFAULT false
);

-- Create team member relationship table
CREATE TABLE team_user_relation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    UNIQUE(team_id, user_id)
);

-- Create contributions table
CREATE TABLE prompt_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    role_category TEXT NOT NULL,
    content TEXT NOT NULL,
    contributor_email TEXT,
    contributor_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    published_prompt_id UUID,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

More SQL files can be found in the `/sql` directory.

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

```
promptMinder/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── prompts/           # Prompt-related pages
│   ├── tags/              # Tag management pages
│   └── ...
├── components/            # React components
│   ├── ui/                # Basic UI components
│   ├── prompt/            # Prompt-related components
│   └── ...
├── contexts/              # React Context
├── hooks/                 # Custom Hooks
├── lib/                   # Utility libraries and configurations
├── messages/              # Internationalization files
├── public/                # Static resources
└── sql/                   # Database scripts
```

### Code Standards

- Use ESLint for code checking
- Follow React Hooks best practices
- Components use TypeScript (recommended)
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
